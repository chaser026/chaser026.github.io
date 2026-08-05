# Qwen3 Technical Report

**Abstract**

Qwen3 是 Qwen 模型家族的最新版本，包含 **Dense** 和 **MoE** 两种架构，参数规模从 **0.6B 到 235B**。核心创新包括：

- **思考模式（Thinking Mode）与非思考模式（Non-thinking Mode）** 的统一集成，用户无需在不同模型间切换；
- **思考预算（Thinking Budget）机制**，允许用户在推理时动态分配计算资源；
- 预训练数据达 **36 万亿 tokens**，多语言支持从 29 种扩展至 **119 种语言和方言**；
- 全部模型在 **Apache 2.0** 协议下开源发布。

实验结果表明，Qwen3 在代码生成、数学推理、智能体任务等多项基准上达到最先进水平，与更大规模的 MoE 模型及闭源模型相比具有竞争力。

## 1 Introduction

当前 AI 领域正快速推进通用人工智能（AGI）目标。GPT-4o、Claude 3.7、Gemini 2.5、DeepSeek-V3、Llama-4、Qwen2.5 等大型基础模型已取得显著进展，基于强化学习的推理模型（如 o3、DeepSeek-R1）进一步推动了推理时扩展能力的发展。

**Qwen3 的主要贡献**：

![](content/projects/读论文/Qwen/media/image1.png)

**点击图片可查看完整电子表格**

预训练采用三阶段策略（通用 → 推理增强 → 长上下文），后训练采用四阶段流程（长CoT冷启动 → 推理RL → 模式融合 → 通用RL），轻量模型通过**强对弱蒸馏**显著降低训练成本。

## 2 Architecture

**模型系列**

Qwen3 包含 **6 个 Dense 模型**和 **2 个 MoE 模型**：

**Dense 模型架构**

![](content/projects/读论文/Qwen/media/image2.png)

**点击图片可查看完整电子表格**

**MoE 模型架构**

![](content/projects/读论文/Qwen/media/image3.png)

**点击图片可查看完整电子表格**

**主要架构特点**

- **基础组件**：GQA（分组查询注意力）、SwiGLU、RoPE 旋转位置编码、RMSNorm 预归一化；
- **改进点**：移除 Qwen2 中的 QKV-bias，引入 **QK-Norm** 以确保训练稳定性；
- **MoE 特性**：128 个专家，每 token 激活 8 个；采用**全局批次负载均衡损失**；去除共享专家设计；
- **分词器**：基于 BBPE，词表大小 **151,669**。

## 3 Pre-training

### 3.1 Pre-training Data

与 Qwen2.5 相比，Qwen3 预训练数据在规模和多样性上大幅提升：

- **总规模**：36 万亿 tokens，覆盖 **119 种语言和方言**（Qwen2.5 为 29 种）；
- **数据来源**：
  - 使用 **Qwen2.5-VL** 对大量 PDF 文档进行 OCR 识别，再由 Qwen2.5 精化，获得数万亿高质量文本；
  - 使用 **Qwen2.5-Math** 和 **Qwen2.5-Coder** 合成数学和代码领域数据；
  - 额外扩充多语言数据；
- **数据标注**：开发了多语言数据标注系统，对超过 30 万亿 tokens 进行教育价值、领域、安全性等多维标注，支持实例级（而非数据源级）的数据混合优化。

### 3.2 Pre-training Stage

采用**三阶段**预训练策略：

![](content/projects/读论文/Qwen/media/image4.png)

**点击图片可查看完整电子表格**

长上下文阶段使用 **ABF 技术**将 RoPE 基频从 10,000 提升至 1,000,000，并引入 **YARN** 和双块注意力（DCA）实现 4 倍推理长度扩展；

遵循 Qwen2.5 的方法，通过缩放律实验确定各模型的最优超参数。

### 3.3 Pre-training Evaluation

在 **15 个基准**上对 Qwen3 基础模型进行评估，涵盖通用知识、数学/STEM、编程和多语言能力。

**关键结论**：

- **Qwen3-235B-A22B-Base** 在大多数基准上超越 DeepSeek-V3-Base、Llama-4-Maverick-Base 等，且参数量更少（总参数约为 DeepSeek-V3 的 1/3，激活参数约 2/3）；
- **Qwen3 MoE 基础模型**以仅 1/5 的激活参数达到 Qwen3 Dense 模型的相当性能；
- **Qwen3 Dense 基础模型**实现了参数"降维打击"：Qwen3-8B/4B/1.7B-Base 在超过一半的基准上超越 Qwen2.5-14B/7B/3B-Base，在 STEM 和编程任务上优势尤为突出。

## 4 Post-training

后训练管道以两大目标为核心**：思考模式控制** 和 **强对弱蒸馏**。旗舰模型经历四阶段训练，轻量模型通过蒸馏高效构建（GPU 消耗仅为四阶段训练的 1/10）。

### 4.1 Long-CoT Cold Start

**目标**：为模型植入基础推理模式，而非追求即时推理性能。

**数据构建**：覆盖数学、代码、逻辑推理、STEM 等类别，每道题配有可验证的参考答案；

**双阶段过滤**：

- *查询过滤*：使用 Qwen2.5-72B-Instruct 排除不可验证查询、无需推理即可回答的简单问题；
- *响应过滤*：使用 QwQ-32B 生成候选回答，过滤答案错误、存在大量重复、依赖猜测或存在格式问题的样本；

**训练策略**：最小化训练样本数和步数，为后续 RL 阶段保留更大的探索空间。

```text
原始 Query 池
↓ Qwen2.5-72B 过滤
├─ 排除：不可验证 / 无需CoT / 开放生成
└─ 保留：难度适中、需要深度推理、可验证
↓ 领域均衡标注
↓ QwQ-32B 生成 N 个候选回答
↓ 6 条标准严格过滤
↓
精选数据集
├─ 小子集 → Cold Start SFT（最少量训练）
└─ 剩余 → Reasoning RL 阶段使用
```

### 4.2 Reasoning RL

**目标**：通过强化学习进一步提升推理能力。

**数据要求**：3,995 个 query-verifier 对，未用于冷启动阶段，满足"可学习、有挑战性、覆盖子领域广"的标准；

**训练算法**：采用 **GRPO**，配合大批次、高 rollout 数和离策略训练提高样本效率；

**熵控制**：通过控制模型熵稳定增加或保持稳定，确保探索与利用的平衡；

**效果**：Qwen3-235B-A22B 的 AIME'24 得分从 70.1 提升至 85.1（经过 170 步 RL 训练）。

### 4.3 Thinking Mode Fusion

**目标**：将非思考能力整合到已具备思考能力的模型中。

**SFT 数据构建**：

- *思考模式数据*：使用 Stage 2 模型在 Stage 1 查询上进行拒绝采样生成；
- *非思考模式数据*：精心整理，涵盖编程、数学、指令遵循、多语言、创意写作等多类任务；

**对话模板设计**：引入 /think 和 /no think 标志，非思考模式响应保留空思考块（`<think></think>`），确保格式一致性；

**思考预算**：当思考长度达到用户定义阈值时，自动插入停止指令并基于已有推理生成最终响应——该能力**自然涌现**，无需显式训练。

```yaml
### 完整的生成流程
generate() 开始
↓
每生成一个 token，LogitsProcessor 被调用一次
↓
├─ token 是 <think> 开始标志？
│ → 开始计数
│
├─ 在 think 块内？
│ → thinking_count += 1
│
└─ thinking_count >= budget？
→ 不是 → 正常生成
→ 是 → 强制插入 stop 指令
↓
把 stop_instruction 对应的
token 序列 logit 设为 +inf
其他 token logit 设为 -inf
↓
模型被迫输出 stop 指令
↓
</think> 关闭思考块
↓
后续正常生成 answer
```

正常 generate 循环：

```text
Step t:
input_ids → model forward → logits
↓
LogitsProcessor
把目标 token logit → +inf
其他 token logit → -inf
↓
sample/argmax → 强制选出目标 token
↓
token 追加到 input_ids
↓
KV Cache 正常更新 ✅

Step t+1:
继续生成下一个 token
上一步的 token 已经在 KV Cache 里了
```

### 4.4 General RL

**目标**：全面提升模型在多样化场景下的能力和稳定性。

覆盖 **20+ 种任务**，针对以下核心能力设计定制化奖励：

![](content/projects/读论文/Qwen/media/image5.png)

**点击图片可查看完整电子表格**

三类奖励机制：**基于规则的奖励**、**带参考答案的模型奖励**、**不带参考答案的偏好奖励模型**。

### 4.5 Strong-to-Weak Distillation

**目标**：高效构建轻量模型（5 个 Dense + 1 个 MoE）。

两阶段蒸馏流程：

- **离策略蒸馏（Off-policy）**：使用教师模型在 /think 和 /no think 模式下生成的输出，帮助学生模型建立基础推理能力和模式切换能力；
- **在策略蒸馏（On-policy）**：学生模型生成 on-policy 序列，通过与教师模型（Qwen3-32B 或 Qwen3-235B-A22B）对齐 logits（最小化 KL 散度）进行微调。

**效率优势**：与 RL 相比，在策略蒸馏仅需 **1/10 的 GPU 时**，且 Pass@1 和 Pass@64 均更优，表明蒸馏能扩大学生模型的探索空间。

### 4.6 Post-training Evaluation

在**思考模式**和**非思考模式**下全面评估，涵盖以下维度：

- **通用任务**：MMLU-Redux、GPQA-Diamond、C-Eval、LiveBench
- **对齐任务**：IFEval、Arena-Hard、AlignBench v1.1、Creative Writing V3、WritingBench
- **数学与推理**：MATH-500、AIME'24/25、ZebraLogic、AutoLogi
- **智能体与编程**：BFCL v3、LiveCodeBench v5、CodeForces
- **多语言**：Multi-IF、INCLUDE、MMMLU、MT-AIME2024、PolyMath、MLogiQA

**核心结论**：

- **Qwen3-235B-A22B** 在思考和非思考模式下均达到开源模型最优，超越 DeepSeek-R1/V3，与 OpenAI-o1、Gemini2.5-Pro 等闭源顶级模型高度竞争；
- **Qwen3-32B** 在思考模式下超越 QwQ-32B（17/23 基准），与闭源 OpenAI-o3-mini 相当；非思考模式下超越 Qwen2.5-72B-Instruct；
- **轻量模型**（Qwen3-30B-A3B、Qwen3-14B 等）表现持续优于参数量相近或更大的开源竞品，验证了强对弱蒸馏的有效性。

### 4.7 Discussion

**思考预算的有效性**

Qwen3-235B-A22B 在数学、编程、STEM 等基准上随思考预算增加呈现**平稳可扩展的性能提升**，未来进一步延长输出长度（>32K）有望带来更多收益。

**在策略蒸馏的效率优势**

以 Qwen3-8B 为例：

![](content/projects/读论文/Qwen/media/image6.png)

**点击图片可查看完整电子表格**

在策略蒸馏在 Pass@64 上也优于 RL，表明其能有效扩大模型探索空间。

**思考模式融合与通用 RL 的效果**

以 Qwen3-32B 各训练阶段为例：

- **Stage 3（模式融合）**：成功赋予非思考模式，ThinkFollow 初始得分 88.7，通用能力明显提升（CounterFactQA +10.9，LengthCtrl +8.0）；
- **Stage 4（通用 RL）**：ThinkFollow 提升至 98.9，工具调用能力（ToolUse）提升 +15.1；
- **代价**：AIME'24 等复杂推理任务在思考模式下略有下降（接受的性能权衡，以换取更广泛的通用性）。

## 5 Conclusion

Qwen3 是 Qwen 系列的最新版本，其核心亮点总结如下：

- 支持 **Thinking / Non-thinking 双模式**，用户可动态管理推理 token 预算；
- 基于 **36 万亿 tokens** 预训练，支持 **119 种语言和方言**；
- 在代码、数学、推理、智能体等多类标准基准上表现卓越；
- 全部模型以 **Apache 2.0** 协议开源。

**未来研究方向**：

- 持续扩大高质量、多样化预训练数据；
- 改进模型架构和训练方法（高效压缩、超长上下文等）；
- 增加强化学习算力投入，特别是基于环境反馈的**智能体 RL 系统**，以构建能够处理复杂长链任务的智能体。

## Appendix

### A.1 Additional Evaluation Results

#### A.1.1 Long-Context Ability

使用 **RULER 基准**（通过 YARN 4× 缩放实现长度外推）评估长上下文处理能力：

**关键发现**：

- **非思考模式**：Qwen3 在各长度段（4K–128K）上均优于同规模 Qwen2.5 模型，如 Qwen3-14B（非思考）以 94.6 平均分超越 Qwen2.5-32B-Instruct 的 92.9；
- **思考模式**：性能略有下降，推测是思考内容对检索类任务帮助有限甚至产生干扰；提升思考模式的长上下文能力是未来工作方向。

#### A.1.2 Multilingual Ability

在**西班牙语、法语、葡萄牙语、意大利语、阿拉伯语、日语、韩语、印尼语、俄语、越南语、德语、泰语** 12 种语言上，以及 **Belebele 基准**（80 种支持语言）进行详细评测：

**关键发现**：

- 在所有评测语言中，Qwen3 系列模型均实现了竞争性能力；
- **思考模式**在多语言任务（特别是 MT-AIME2024）上显著优于非思考模式，体现了推理能力对多语言数学任务的价值；
- 在 Belebele 基准上，Qwen3 与同规模 Gemma 模型表现相当，大幅超越 Qwen2.5，体现了多语言能力的系统性提升（语言支持从 29 → 119 种）。
