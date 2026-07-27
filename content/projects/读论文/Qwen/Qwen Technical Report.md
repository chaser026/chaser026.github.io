# Qwen Technical Report

视频链接: https://pan\.baidu\.com/s/1MvSo33Fir8YlRd07HyvVaw?pwd=x34f 提取码: x34f

## 1\. Introduction（引言）

- **模型系列介绍**：推出了 QWEN（千问）大语言模型系列，包含：

    - 基础预训练模型（QWEN）

    - 人类对齐对话模型（QWEN\-CHAT）

    - 特定领域的代码模型（CODE\-QWEN）

    - 数学模型（MATH\-QWEN）

- **参数规模与开源**：涵盖 **1\.8B、7B 和 14B** 三种参数规模，其中 7B 和 14B 的 base 和 chat 模型已正式开源。

- **核心能力**：模型不仅在传统的自然语言任务上表现出色，还具备：

    - 强大的工具使用（Tool\-use）

    - 代码解释器（Code Interpreter）

    - 作为 Agent（智能体）的规划能力

---

## 2\. Pretraining（预训练）

### 2\.1 Data（数据）

- **数据规模与构成**：3T tokens，包含网页、百科、书籍、代码等，高度多语言化（主要为中英文），多任务指令微调数据。

- **数据清洗与去重**： 

    - 使用精确匹配和 **MinHash LSH** 算法去重

    - 结合规则和机器学习模型（如语言模型、质量打分模型）过滤低质量和不安全内容

- **防污染机制（Decontamination）**：严格剔除与下游评测数据集重合的测试集数据，确保评测客观性。

---

### 2\.2 Tokenization（分词机制）

- **词表构建**：基于 OpenAI 的 tiktoken（`cl100k_base`）进行 BPE 分词初始化。

> - `cl100k` 是 OpenAI 的开源快速 BPE 分词库 tiktoken 中包含的基础词表，该词表在海量英文文本和代码数据上进行了深度的 BPE（字节对编码）统计与训练，对英文和代码的切分极其高效。但因主要针对英文，处理中文等其他语言时效率较低（通常会把一个汉字切碎成好几个毫无意义的字节 token）。
> 
> 

- **词表扩充**：

    - 扩充了常用中文字符、词组及其他多语言词汇

    - 将数字拆分为单个数字（提升数学能力）

- **最终词表**：大小约为 **152K**，在多语言（尤其是中文）上拥有极高的压缩效率。

    > - 保留 `cl100k` 意味着继承了 GPT\-4 的英文和代码分词能力
    > 
    > - 额外统计并附加 52K 的中文及多语言高频词，使得模型处理中文时无需用多个繁琐的字节拼凑一个词，极大提高了中文训练效率和推理速度
    > 
    > - 这 52K 个 token 对应的 merges 规则，是在冻结前 100K 规则的前提下，在中文语料上继续推演 BPE 算法 52,000 步得来的。构造文件时，直接把这 52,000 步的合并历史按照生成顺序（Rank 100,277 → 152,000）追加到原文件末尾即可。
    > 
    > 

---

### 2\.3 Architecture（模型架构）

基于改进的 Transformer 架构（类似 LLaMA），主要调整包括：

---

### 2\.4 Training（训练细节）

- 自回归语言模型目标（Next\-token prediction），上下文长度设为 **2048**

- 使用 **Flash Attention** 加速计算并降低显存

- 优化器为 **AdamW**，采用 Cosine 学习率调度和 BFloat16 混合精度训练

---

### 2\.5 Context Length Extension（上下文长度扩展）

- **免训练扩展技术**（仅在推理阶段应用）： 

    - NTK\-aware 插值

    - 动态 NTK\-aware 插值

- **其他机制**： 

    - 引入 **LogN\-Scaling** 调整注意力点积的缩放

    - 采用分层窗口注意力机制（低层用短窗口，高层用长窗口）

- 结合以上方法可将上下文扩展至 **8192** 甚至更长

---

### 2\.6 Experimental Results（实验结果）

在 MMLU、C\-Eval、GSM8K、HumanEval 等多项榜单上，**QWEN\-14B** 显著超越同级别开源模型（如 LLaMA\-2\-13B、Baichuan2\-13B 等），部分任务逼近更大规模的模型。

---

## 3\. Alignment（对齐）

### 3\.1 Supervised Finetuning（有监督微调）

#### 3\.1\.1 Data（数据）

- 不依赖传统的 Prompt 模板，而是构建高质量、多样化的"人类对话风格"指令数据，包含安全类数据

- 采用 **ChatML** 格式，通过特殊 token 明确区分 System、User 和 Assistant 的角色边界

#### 3\.1\.2 Training（训练）

- 仅对 Assistant 的输出计算 Loss（Mask 掉系统和用户输入）

- 序列长度 2048，训练 4000 steps

---

### 3\.2 Reinforcement Learning from Human Feedback（基于人类反馈的强化学习）

#### 3\.2\.1 Reward Model（奖励模型）

先用全量对比数据进行 **PMP（偏好模型预训练）**，再用精细标注的高质量数据微调。在 QWEN 基础上增加池化层（Pooling layer）输出标量奖励。

**训练流程：**

```Plain Text
1. 收集 prompt
      ↓
2. 用多个 Qwen 模型生成回答
      ↓
3. 人类比较回答
      ↓
4. 形成 pairwise preference data
      ↓
5. PMP 预训练 reward model
      ↓
6. 用高质量数据微调 reward model
      ↓
7. 得到最终 RM
```

**RM 训练损失：**

$L = -\log\sigma(r_{good} - r_{bad})$

**奖励计算方式：**

$\text{取最后一个 token} \xrightarrow{\text{Pooling layer}} \xrightarrow{\text{Linear layer}} \text{标量 } r$

---

#### 3\.2\.2 Reinforcement Learning（强化学习）

采用 **PPO** 算法。为了缓解**对齐税（Alignment Tax）**（即对齐导致基础能力下降），在损失函数中引入了**预训练梯度（Pretrained Gradient）**。

**每个训练 Step 的流程：**

```Plain Text
1. 从 PPO Buffer 采样      → 计算 L_PPO
            ↓
2. 从 Pretrain Dataset 采样 → 计算 L_pretrain = -log P(x)
            ↓
3. L_total = L_PPO + λ · L_pretrain
            ↓
4. 反向传播更新模型
```

---

### 3\.3 Automatic and Human Evaluation of Aligned Models（对齐模型评测）

- **自动评测**：QWEN\-CHAT 在主流榜单上维持极高水准

- **人工盲测（Human Evaluation）**：RLHF 模型在人类偏好上显著优于 SFT 模型，在各种任务中的胜率极具竞争力，**仅次于 GPT\-4**

---

### 3\.4 Tool Use, Code Interpreter, and Agent（工具使用、代码解释器与智能体）

通过 **Self\-instruct** 策略构造工具调用数据，融入基础 SFT 数据中：

```Plain Text
第1轮：生成 → 过滤 → 收集样本
        ↓
第2轮：用新样本微调 QWEN → 用改进的 QWEN 生成更好的样本
        ↓
第3轮：重复...
        ↓
最终：约 2000 个高质量样本
```

**模型能力：**

- 通过 **ReAct 提示法** 调用未见过的外部 API

- 编写和执行 Python 代码（**Code Interpreter**）解决复杂的数学和数据可视化问题

- 作为 **Hugging Face Agent** 调度各种多模态模型

---

## 4\. CODE\-QWEN：Specialized Model for Coding（代码专属模型）

### 4\.1 Code Pretraining（代码预训练）

- 并非从零训练，而是在 QWEN 基础模型上，继续使用约 **90B** 的高质量代码数据进行**连续预训练（Continued Pretraining）**

- 上下文长度扩展至 **8192**

### 4\.2 Code Supervised Fine\-Tuning（代码有监督微调）

采用**多阶段 SFT 策略**训练 CODE\-QWEN\-CHAT，优化其在代码生成、调试和解释上的对话能力。

### 4\.3 Evaluation（评测）

在 HumanEval、MBPP 等榜单上显著超越同规模的代码模型（如 Code LLaMA、StarCoder），大幅提升代码生成准确率。

---

## 5\. MATH\-QWEN：Specialized Model for Mathematics Reasoning（数学专属模型）

### 5\.1 Training（训练）

- 直接在增强的数学指令数据集上对基础模型进行 SFT 训练，得到 MATH\-QWEN\-CHAT

- 采用 **1024** 序列长度加速训练，同样屏蔽用户输入的 Loss

### 5\.2 Evaluation（评测）

在 GSM8K 和 MATH 榜单上大幅领先同等规模的开源模型（如 WizardMath），**14B 版本的分数直逼 GPT\-3\.5 和 Minerva\-62B**。

---

## 6\. Related Work（相关工作）

---

## 7\. Conclusion（结论）

- 总结 QWEN 系列模型的贡献，宣布 **1\.8B、7B 和 14B** 版本开源

- 强调开源模型具有与专有模型（Proprietary models）相匹配的竞争力

- 期望促进社区在 LLM 基础能力、Agent 实际应用等方向的创新

---

## A\. Appendix（附录）

### A\.1 More Training Details

提供了 **ChatML 格式**的直观代码示例，解释了如何用 `<|im_start|>` 和 `<|im_end|>` 避免传统对话格式的上下文歧义。

### A\.2 Evaluation

- 展示了各大榜单（如 MMLU、C\-Eval 等）极为详尽的分项得分

- 提供大量人工评测的真实对话 Case（中英文对照），覆盖常识、语言理解、创意写作和代码解释

### A\.3 Analysis of Code Interpreter

提供具体的 Case 展示 QWEN\-CHAT 如何通过代码解释器：

1. 生成分步计划

2. 读取数据

3. 绘制图表

并对比了其他模型的不足。

