# AI Reference Stack

> **Purpose:** one high-signal Markdown index for discovering current AI research labs, their research/blog/paper/code surfaces, major AI/ML conference proceedings, open paper-discovery systems, and the modern training/inference software stack.
 
**Scope:** AI/ML research + foundation models + open research discovery + training/post-training/inference systems.  
**Design principle:** primary sources first; rank/discovery sites are used to prioritize what to watch, not as substitutes for papers, model cards, repositories, or official documentation.

## 0. Ranking and curation methodology

There is no single authoritative global ranking of 50 AI research labs. This file therefore uses a **composite reference-priority ranking**. The ordering emphasizes current research usefulness rather than corporate valuation or marketing visibility.

Ranking signals used:

1. **Current frontier-model capability signal:** Artificial Analysis Intelligence Index and LMArena model/lab leaderboards.
2. **Model-production/notability signal:** Epoch AI model/organization datasets and Stanford AI Index 2026 Research & Development.
3. **Research-output signal:** official publication indexes, conference proceedings, and academic institutional output.
4. **Open ecosystem signal:** public weights, code, model hubs, reproducible technical reports, infrastructure/tooling influence.
5. **Breadth/continuity signal:** active work across model architecture, post-training, multimodality, agents, robotics/science, and systems.

Reference sources:

- Artificial Analysis models: https://artificialanalysis.ai/models/
- LMArena leaderboards: https://lmarena.ai/leaderboard
- Epoch AI model database: https://epoch.ai/data/ai-models
- Epoch AI companies: https://epoch.ai/data/ai-companies
- Stanford AI Index 2026 — R&D: https://hai.stanford.edu/ai-index/2026-ai-index-report/research-and-development
- Hugging Face Open LLM Leaderboard: https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard
- CSRankings (academic cross-check): https://csrankings.org/

**Interpretation rule:** ranks 1–50 below are not claims that lab `i` is scientifically “better” than lab `i+1`; they are a practical watch order for a research reference index. Re-rank periodically because frontier capability and open-source activity move quickly.

## 1. Top 50 AI research labs / organizations

For every lab, the sibling surfaces are: **Home → Research → Papers/Publications → Research/Engineering Blog → Code → Model Hub → Search recipe**.

| # | Lab / organization | Why track | Home | Research | Papers | Blog / engineering | Code | Models | Search recipe |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | **Anthropic** | Frontier foundation models; alignment; interpretability; agents; science | [home](https://www.anthropic.com/) | [research](https://www.anthropic.com/research) | [papers](https://www.anthropic.com/research) | [blog](https://www.anthropic.com/engineering) | [code](https://github.com/anthropics) | [models](https://huggingface.co/Anthropic) | `site:anthropic.com/research "<topic>" OR site:arxiv.org/abs "Anthropic" "<topic>"` |
| 2 | **OpenAI** | Frontier multimodal/reasoning models; agents; alignment; scientific reasoning | [home](https://openai.com/) | [research](https://openai.com/research/) | [papers](https://openai.com/research/index/publication/) | [blog](https://openai.com/news/research/) | [code](https://github.com/openai) | [models](https://huggingface.co/openai) | `site:openai.com/research "<topic>" OR site:arxiv.org/abs "OpenAI" "<topic>"` |
| 3 | **Google DeepMind** | Frontier multimodal models; RL; world models; robotics; AI for science | [home](https://deepmind.google/) | [research](https://deepmind.google/research/) | [papers](https://deepmind.google/research/publications/) | [blog](https://deepmind.google/discover/blog/) | [code](https://github.com/google-deepmind) | [models](https://huggingface.co/google) | `site:deepmind.google/research/publications "<topic>" OR site:arxiv.org/abs "Google DeepMind" "<topic>"` |
| 4 | **Meta AI / FAIR** | Open-weight foundation models; vision; speech; multimodal; retrieval; systems | [home](https://ai.meta.com/) | [research](https://ai.meta.com/research/) | [papers](https://ai.meta.com/results/?content_types%5B0%5D=publication) | [blog](https://ai.meta.com/blog/) | [code](https://github.com/facebookresearch) | [models](https://huggingface.co/meta-llama) | `site:ai.meta.com/results publication "<topic>" OR site:arxiv.org/abs "Meta AI" "<topic>"` |
| 5 | **Alibaba Qwen** | Open-weight LLM/VLM/omni models; agents; coding; long context | [home](https://qwen.ai/) | [research](https://qwenlm.github.io/) | [papers](https://qwenlm.github.io/) | [blog](https://qwenlm.github.io/blog/) | [code](https://github.com/QwenLM) | [models](https://huggingface.co/Qwen) | `site:qwenlm.github.io "<topic>" OR site:arxiv.org/abs "Qwen" "<topic>"` |
| 6 | **Z.ai / Zhipu AI / GLM** | Frontier and open-weight GLM family; multimodal; agents; post-training | [home](https://z.ai/) | [research](https://z.ai/blog) | [papers](https://z.ai/blog) | [blog](https://z.ai/blog) | [code](https://github.com/zai-org) | [models](https://huggingface.co/zai-org) | `site:arxiv.org/abs ("Zhipu" OR "Z.ai" OR "GLM") "<topic>"` |
| 7 | **Moonshot AI / Kimi** | Long-context and agentic models; open-weight MoE; attention architecture research | [home](https://www.moonshot.ai/) | [research](https://github.com/MoonshotAI) | [papers](https://github.com/MoonshotAI) | [blog](https://www.moonshot.ai/) | [code](https://github.com/MoonshotAI) | [models](https://huggingface.co/moonshotai) | `site:arxiv.org/abs ("Moonshot AI" OR "Kimi") "<topic>"` |
| 8 | **DeepSeek** | Open-weight frontier LLMs; reasoning; MoE; MLA; efficient training/inference | [home](https://www.deepseek.com/) | [research](https://github.com/deepseek-ai) | [papers](https://github.com/deepseek-ai) | [blog](https://www.deepseek.com/) | [code](https://github.com/deepseek-ai) | [models](https://huggingface.co/deepseek-ai) | `site:arxiv.org/abs "DeepSeek" "<topic>" OR site:github.com/deepseek-ai "<topic>"` |
| 9 | **xAI / SpaceXAI** | Frontier general models; reasoning; coding; multimodal systems | [home](https://x.ai/) | [research](https://x.ai/news/) | [papers](https://x.ai/news/) | [blog](https://x.ai/news/) | [code](https://github.com/xai-org) | [models](https://huggingface.co/xai-org) | `site:x.ai/news "<topic>" OR site:arxiv.org/abs ("xAI" OR "Grok") "<topic>"` |
| 10 | **ByteDance Seed** | Foundation models; multimodal; video; speech; agents; infrastructure; AI for science | [home](https://seed.bytedance.com/en/) | [research](https://seed.bytedance.com/en/research) | [papers](https://seed.bytedance.com/en/public_papers) | [blog](https://seed.bytedance.com/en/research) | [code](https://github.com/ByteDance-Seed) | [models](https://huggingface.co/ByteDance-Seed) | `site:seed.bytedance.com/en/public_papers "<topic>" OR site:arxiv.org/abs "ByteDance Seed" "<topic>"` |
| 11 | **Mistral AI** | Efficient open/proprietary LLMs; MoE; coding; agents; small/frontier models | [home](https://mistral.ai/) | [research](https://mistral.ai/news/) | [papers](https://mistral.ai/news/) | [blog](https://mistral.ai/news/) | [code](https://github.com/mistralai) | [models](https://huggingface.co/mistralai) | `site:mistral.ai/news "<topic>" OR site:arxiv.org/abs "Mistral AI" "<topic>"` |
| 12 | **MiniMax** | Frontier multimodal/text/video models; long context; agents | [home](https://www.minimax.io/) | [research](https://www.minimax.io/news) | [papers](https://www.minimax.io/news) | [blog](https://www.minimax.io/news) | [code](https://github.com/MiniMax-AI) | [models](https://huggingface.co/MiniMaxAI) | `site:arxiv.org/abs "MiniMax" "<topic>" OR site:minimax.io "<topic>"` |
| 13 | **Microsoft Research / Microsoft AI** | Foundation models; systems; agents; optimization; trustworthy AI; science | [home](https://www.microsoft.com/research/) | [research](https://www.microsoft.com/research/research-area/artificial-intelligence/) | [papers](https://www.microsoft.com/research/publications/) | [blog](https://www.microsoft.com/research/blog/) | [code](https://github.com/microsoft) | [models](https://huggingface.co/microsoft) | `site:microsoft.com/research/publication "<topic>" OR site:arxiv.org/abs "Microsoft Research" "<topic>"` |
| 14 | **NVIDIA Research** | AI systems; LLM training/inference; graphics; vision; robotics; physical AI | [home](https://research.nvidia.com/) | [research](https://research.nvidia.com/) | [papers](https://research.nvidia.com/publications) | [blog](https://developer.nvidia.com/blog/) | [code](https://github.com/NVIDIA) | [models](https://huggingface.co/nvidia) | `site:research.nvidia.com/publications "<topic>" OR site:arxiv.org/abs "NVIDIA" "<topic>"` |
| 15 | **Tencent AI Lab / Hunyuan** | Foundation models; multimodal; vision; speech; agents; games | [home](https://ai.tencent.com/ailab/en/index/) | [research](https://ai.tencent.com/ailab/en/index/) | [papers](https://ai.tencent.com/ailab/en/paper/) | [blog](https://ai.tencent.com/ailab/en/news/) | [code](https://github.com/Tencent-Hunyuan) | [models](https://huggingface.co/tencent) | `site:arxiv.org/abs ("Tencent AI Lab" OR "Hunyuan") "<topic>"` |
| 16 | **Baidu Research / ERNIE / Paddle** | Foundation models; NLP; vision; autonomous systems; deep-learning platforms | [home](https://research.baidu.com/) | [research](https://research.baidu.com/) | [papers](https://research.baidu.com/Publications) | [blog](https://research.baidu.com/Blog) | [code](https://github.com/PaddlePaddle) | [models](https://huggingface.co/baidu) | `site:arxiv.org/abs ("Baidu" OR "ERNIE") "<topic>"` |
| 17 | **Huawei Noah's Ark Lab** | Foundation models; optimization; vision; NLP; scientific ML; systems | [home](https://www.noahlab.com.hk/) | [research](https://www.noahlab.com.hk/) | [papers](https://www.noahlab.com.hk/publications.html) | [blog](https://www.noahlab.com.hk/) | [code](https://github.com/huawei-noah) | [models](https://huggingface.co/huawei-noah) | `site:arxiv.org/abs ("Huawei" AND "Noah") "<topic>"` |
| 18 | **Google Research** | Core ML; language; vision; systems; federated learning; AI for science | [home](https://research.google/) | [research](https://research.google/) | [papers](https://research.google/pubs/) | [blog](https://research.google/blog/) | [code](https://github.com/google-research) | [models](https://huggingface.co/google) | `site:research.google/pubs "<topic>" OR site:arxiv.org/abs "Google Research" "<topic>"` |
| 19 | **Cohere Labs / Cohere For AI** | Enterprise LLMs; multilingual models; retrieval; open science | [home](https://cohere.com/) | [research](https://cohere.com/research) | [papers](https://cohere.com/research) | [blog](https://cohere.com/blog) | [code](https://github.com/CohereForAI) | [models](https://huggingface.co/CohereForAI) | `site:cohere.com/research "<topic>" OR site:arxiv.org/abs ("Cohere" OR "Cohere For AI") "<topic>"` |
| 20 | **Amazon Science / AGI** | Foundation models; agents; recommendation; speech; robotics; optimization | [home](https://www.amazon.science/) | [research](https://www.amazon.science/research-areas/machine-learning) | [papers](https://www.amazon.science/publications) | [blog](https://www.amazon.science/blog) | [code](https://github.com/amazon-science) | [models](https://huggingface.co/amazon) | `site:amazon.science/publications "<topic>" OR site:arxiv.org/abs "Amazon" "<topic>"` |
| 21 | **Apple Machine Learning Research** | On-device ML; multimodal; speech; vision; efficient learning; privacy | [home](https://machinelearning.apple.com/) | [research](https://machinelearning.apple.com/) | [papers](https://machinelearning.apple.com/research) | [blog](https://machinelearning.apple.com/) | [code](https://github.com/apple) | [models](https://huggingface.co/apple) | `site:machinelearning.apple.com/research "<topic>"` |
| 22 | **Allen Institute for AI (Ai2)** | Open foundation models; NLP; vision-language; science; agents; robotics | [home](https://allenai.org/) | [research](https://allenai.org/research) | [papers](https://allenai.org/papers) | [blog](https://allenai.org/blog) | [code](https://github.com/allenai) | [models](https://huggingface.co/allenai) | `site:allenai.org/papers "<topic>" OR site:arxiv.org/abs "Allen Institute for AI" "<topic>"` |
| 23 | **Salesforce AI Research** | LLMs; agents; multimodal; code; retrieval; enterprise AI | [home](https://www.salesforceairesearch.com/) | [research](https://www.salesforceairesearch.com/) | [papers](https://www.salesforceairesearch.com/research) | [blog](https://www.salesforceairesearch.com/blog) | [code](https://github.com/salesforce) | [models](https://huggingface.co/Salesforce) | `site:salesforceairesearch.com "<topic>" OR site:arxiv.org/abs "Salesforce Research" "<topic>"` |
| 24 | **IBM Research AI** | Foundation models; enterprise AI; neuro-symbolic AI; trustworthy AI; systems | [home](https://research.ibm.com/artificial-intelligence) | [research](https://research.ibm.com/artificial-intelligence) | [papers](https://research.ibm.com/publications) | [blog](https://research.ibm.com/blog) | [code](https://github.com/IBM) | [models](https://huggingface.co/ibm-granite) | `site:research.ibm.com/publications "<topic>" AND AI` |
| 25 | **Databricks / Mosaic AI Research** | LLM training; data systems; evaluation; efficient foundation-model development | [home](https://www.databricks.com/) | [research](https://www.databricks.com/research) | [papers](https://www.databricks.com/research) | [blog](https://www.databricks.com/blog/category/engineering) | [code](https://github.com/mosaicml) | [models](https://huggingface.co/mosaicml) | `site:databricks.com/research "<topic>" OR site:arxiv.org/abs ("MosaicML" OR "Databricks") "<topic>"` |
| 26 | **Together AI Research** | Open models; distributed training; inference; model systems; post-training | [home](https://www.together.ai/) | [research](https://www.together.ai/research) | [papers](https://www.together.ai/research) | [blog](https://www.together.ai/blog) | [code](https://github.com/togethercomputer) | [models](https://huggingface.co/togethercomputer) | `site:together.ai/research "<topic>" OR site:arxiv.org/abs "Together AI" "<topic>"` |
| 27 | **Hugging Face Research** | Open-model ecosystem; datasets; training; evaluation; agents; community research | [home](https://huggingface.co/) | [research](https://huggingface.co/papers) | [papers](https://huggingface.co/papers) | [blog](https://huggingface.co/blog) | [code](https://github.com/huggingface) | [models](https://huggingface.co/) | `site:huggingface.co/papers "<topic>" OR site:huggingface.co/blog "<topic>"` |
| 28 | **LG AI Research** | Foundation models; multimodal; enterprise/scientific AI; EXAONE | [home](https://www.lgresearch.ai/) | [research](https://www.lgresearch.ai/) | [papers](https://www.lgresearch.ai/) | [blog](https://www.lgresearch.ai/) | [code](https://github.com/LG-AI-EXAONE) | [models](https://huggingface.co/LGAI-EXAONE) | `site:arxiv.org/abs ("LG AI Research" OR "EXAONE") "<topic>"` |
| 29 | **NAVER AI Lab** | Foundation models; multilingual NLP; vision; speech; recommendation; HyperCLOVA | [home](https://naver-ai.github.io/) | [research](https://naver-ai.github.io/) | [papers](https://naver-ai.github.io/publications/) | [blog](https://naver-ai.github.io/) | [code](https://github.com/naver-ai) | [models](https://huggingface.co/naver-clova-ix) | `site:arxiv.org/abs ("NAVER AI Lab" OR "HyperCLOVA") "<topic>"` |
| 30 | **Samsung Research AI** | On-device/foundation AI; vision; speech; language; efficient systems | [home](https://research.samsung.com/artificial-intelligence) | [research](https://research.samsung.com/artificial-intelligence) | [papers](https://research.samsung.com/publications) | [blog](https://research.samsung.com/blog) | [code](https://github.com/Samsung) | [models](https://huggingface.co/Samsung) | `site:research.samsung.com/publications "<topic>" AND AI` |
| 31 | **Sakana AI** | Evolutionary/collective intelligence; scientific agents; efficient model composition | [home](https://sakana.ai/) | [research](https://sakana.ai/research/) | [papers](https://sakana.ai/research/) | [blog](https://sakana.ai/blog/) | [code](https://github.com/SakanaAI) | [models](https://huggingface.co/SakanaAI) | `site:sakana.ai/research "<topic>" OR site:arxiv.org/abs "Sakana AI" "<topic>"` |
| 32 | **Stability AI** | Open generative models; image/video/audio; multimodal generation | [home](https://stability.ai/) | [research](https://stability.ai/research) | [papers](https://stability.ai/research) | [blog](https://stability.ai/news) | [code](https://github.com/Stability-AI) | [models](https://huggingface.co/stabilityai) | `site:stability.ai/research "<topic>" OR site:arxiv.org/abs "Stability AI" "<topic>"` |
| 33 | **Runway Research** | Generative video; world models; multimodal representation and generation | [home](https://runwayml.com/) | [research](https://runwayml.com/research) | [papers](https://runwayml.com/research) | [blog](https://runwayml.com/research) | [code](https://github.com/runwayml) | [models](https://huggingface.co/runwayml) | `site:runwayml.com/research "<topic>" OR site:arxiv.org/abs "Runway" "<topic>"` |
| 34 | **Black Forest Labs** | Frontier image generation and multimodal generative modeling | [home](https://bfl.ai/) | [research](https://bfl.ai/) | [papers](https://bfl.ai/) | [blog](https://bfl.ai/blog) | [code](https://github.com/black-forest-labs) | [models](https://huggingface.co/black-forest-labs) | `site:arxiv.org/abs "Black Forest Labs" "<topic>" OR site:bfl.ai "<topic>"` |
| 35 | **Physical Intelligence** | Vision-language-action models; robotics foundation models; embodied learning | [home](https://www.physicalintelligence.company/) | [research](https://www.physicalintelligence.company/blog) | [papers](https://www.physicalintelligence.company/blog) | [blog](https://www.physicalintelligence.company/blog) | [code](https://github.com/Physical-Intelligence) | [models](https://huggingface.co/physical-intelligence) | `site:arxiv.org/abs "Physical Intelligence" robotics "<topic>"` |
| 36 | **Beijing Academy of AI (BAAI)** | Open foundation models; WuDao/Aquila/FlagAI; alignment; benchmarks | [home](https://www.baai.ac.cn/english.html) | [research](https://www.baai.ac.cn/english.html) | [papers](https://www.baai.ac.cn/english.html) | [blog](https://www.baai.ac.cn/english.html) | [code](https://github.com/FlagOpen) | [models](https://huggingface.co/BAAI) | `site:arxiv.org/abs ("BAAI" OR "Beijing Academy of Artificial Intelligence") "<topic>"` |
| 37 | **Shanghai AI Laboratory** | Foundation models; vision; multimodal; embodied AI; OpenMMLab/InternLM ecosystem | [home](https://www.shlab.org.cn/) | [research](https://www.shlab.org.cn/) | [papers](https://www.shlab.org.cn/) | [blog](https://www.shlab.org.cn/) | [code](https://github.com/InternLM) | [models](https://huggingface.co/internlm) | `site:arxiv.org/abs "Shanghai AI Laboratory" "<topic>"` |
| 38 | **Stanford CRFM** | Foundation models; evaluation; transparency; data; systems; policy-adjacent technical research | [home](https://crfm.stanford.edu/) | [research](https://crfm.stanford.edu/research.html) | [papers](https://crfm.stanford.edu/research.html) | [blog](https://crfm.stanford.edu/) | [code](https://github.com/stanford-crfm) | [models](https://huggingface.co/stanford-crfm) | `site:crfm.stanford.edu "<topic>" OR site:arxiv.org/abs "Stanford CRFM" "<topic>"` |
| 39 | **Stanford AI Lab (SAIL)** | Broad AI: ML, NLP, vision, robotics, reasoning, healthcare, systems | [home](https://ai.stanford.edu/) | [research](https://ai.stanford.edu/research/) | [papers](https://ai.stanford.edu/research/) | [blog](https://ai.stanford.edu/blog/) | [code](https://github.com/stanfordnlp) | [models](https://huggingface.co/stanfordnlp) | `site:ai.stanford.edu "<topic>" OR site:arxiv.org/abs "Stanford" "<topic>"` |
| 40 | **Berkeley AI Research (BAIR)** | ML; RL; robotics; vision; language; generative models; systems | [home](https://bair.berkeley.edu/) | [research](https://bair.berkeley.edu/) | [papers](https://bair.berkeley.edu/) | [blog](https://bair.berkeley.edu/blog/) | [code](https://github.com/berkeleydeeprlcourse) | [models](https://huggingface.co/berkeley-nest) | `site:bair.berkeley.edu/blog "<topic>" OR site:arxiv.org/abs "UC Berkeley" "<topic>"` |
| 41 | **MIT CSAIL** | Broad AI/ML; robotics; systems; vision; NLP; theory; human-AI interaction | [home](https://www.csail.mit.edu/) | [research](https://www.csail.mit.edu/research) | [papers](https://www.csail.mit.edu/research) | [blog](https://www.csail.mit.edu/news) | [code](https://github.com/mit) | [models](https://huggingface.co/mit) | `site:csail.mit.edu "<topic>" OR site:arxiv.org/abs "MIT CSAIL" "<topic>"` |
| 42 | **Carnegie Mellon Machine Learning Department** | ML theory; language; robotics; vision; optimization; systems | [home](https://www.ml.cmu.edu/) | [research](https://www.ml.cmu.edu/research/) | [papers](https://www.ml.cmu.edu/research/) | [blog](https://www.ml.cmu.edu/news/) | [code](https://github.com/cmu-llms) | [models](https://huggingface.co/cmu) | `site:ml.cmu.edu "<topic>" OR site:arxiv.org/abs "Carnegie Mellon" "<topic>"` |
| 43 | **Tsinghua AIR / KEG** | Foundation models; knowledge; agents; multimodal; robotics; efficient AI | [home](https://air.tsinghua.edu.cn/en/) | [research](https://air.tsinghua.edu.cn/en/) | [papers](https://air.tsinghua.edu.cn/en/) | [blog](https://air.tsinghua.edu.cn/en/) | [code](https://github.com/THUDM) | [models](https://huggingface.co/THUDM) | `site:arxiv.org/abs ("Tsinghua" OR "THUDM" OR "KEG") "<topic>"` |
| 44 | **Peking University AI Institute** | Machine learning; language; vision; embodied AI; theory | [home](https://www.ai.pku.edu.cn/) | [research](https://www.ai.pku.edu.cn/) | [papers](https://www.ai.pku.edu.cn/) | [blog](https://www.ai.pku.edu.cn/) | [code](https://github.com/PKU-Alignment) | [models](https://huggingface.co/PKU-Alignment) | `site:arxiv.org/abs "Peking University" "<topic>"` |
| 45 | **Mila – Quebec AI Institute** | Deep learning; generative models; RL; causal ML; responsible AI | [home](https://mila.quebec/en) | [research](https://mila.quebec/en/research) | [papers](https://mila.quebec/en/research) | [blog](https://mila.quebec/en/article) | [code](https://github.com/mila-iqia) | [models](https://huggingface.co/mila-iqia) | `site:mila.quebec "<topic>" OR site:arxiv.org/abs "Mila" "<topic>"` |
| 46 | **Vector Institute** | Machine learning; foundation models; health/science; efficient and trustworthy AI | [home](https://vectorinstitute.ai/) | [research](https://vectorinstitute.ai/research/) | [papers](https://vectorinstitute.ai/research/) | [blog](https://vectorinstitute.ai/news/) | [code](https://github.com/VectorInstitute) | [models](https://huggingface.co/VectorInstitute) | `site:vectorinstitute.ai/research "<topic>" OR site:arxiv.org/abs "Vector Institute" "<topic>"` |
| 47 | **ETH AI Center** | ML; robotics; vision; NLP; scientific ML; trustworthy AI | [home](https://ai.ethz.ch/) | [research](https://ai.ethz.ch/research.html) | [papers](https://ai.ethz.ch/research.html) | [blog](https://ai.ethz.ch/news-and-events.html) | [code](https://github.com/ethz-asl) | [models](https://huggingface.co/ethz) | `site:ai.ethz.ch "<topic>" OR site:arxiv.org/abs "ETH Zurich" "<topic>"` |
| 48 | **Oxford Applied and Theoretical Machine Learning (OATML)** | Bayesian ML; deep learning; robustness; uncertainty; foundation-model research | [home](https://oatml.cs.ox.ac.uk/) | [research](https://oatml.cs.ox.ac.uk/) | [papers](https://oatml.cs.ox.ac.uk/publications.html) | [blog](https://oatml.cs.ox.ac.uk/blog.html) | [code](https://github.com/OATML) | [models](https://huggingface.co/oxford) | `site:oatml.cs.ox.ac.uk "<topic>" OR site:arxiv.org/abs "Oxford" "<topic>"` |
| 49 | **NYU CILVR** | Computer vision; representation learning; generative models; self-supervised learning | [home](https://wp.nyu.edu/cilvr/) | [research](https://wp.nyu.edu/cilvr/) | [papers](https://wp.nyu.edu/cilvr/publications/) | [blog](https://wp.nyu.edu/cilvr/) | [code](https://github.com/nyu-dl) | [models](https://huggingface.co/nyu) | `site:arxiv.org/abs ("NYU" AND "CILVR") "<topic>"` |
| 50 | **Max Planck Institute for Intelligent Systems (MPI-IS)** | ML; robotics; perception; embodied intelligence; scientific learning | [home](https://is.mpg.de/) | [research](https://is.mpg.de/research) | [papers](https://is.mpg.de/publications) | [blog](https://is.mpg.de/news) | [code](https://github.com/mpi-is) | [models](https://huggingface.co/mpi-is) | `site:is.mpg.de/publications "<topic>" OR site:arxiv.org/abs "Max Planck Institute for Intelligent Systems" "<topic>"` |

### 1.1 Lab-level search protocol

Use this sequence when investigating any lab; do not start from social summaries:

1. **Official research index** → newest technical releases and lab-authored explanations.
2. **Official publication index** → paper title, author list, venue, project page, supplementary material.
3. **arXiv/OpenReview/proceedings** → primary paper and revision history.
4. **Official GitHub/model hub** → code, configs, checkpoints, licenses, issues, reproducibility details.
5. **Independent model measurement** → Artificial Analysis/LMArena/HF leaderboard only after identifying exact model/version.
6. **Cross-check bibliographic identity** → Semantic Scholar/OpenAlex/DBLP; avoid merging similarly named models or papers.

Reusable search templates:

```text
# Lab + topic
site:arxiv.org/abs "<LAB>" "<TOPIC>"
site:openreview.net "<LAB>" "<TOPIC>"
site:github.com/<ORG> "<TOPIC>"

# Find training/inference details
"<MODEL_NAME>" (training OR pretraining OR post-training OR inference OR architecture) filetype:pdf

# Find exact venue version
"<PAPER_TITLE>" (NeurIPS OR ICML OR ICLR OR ACL OR CVPR OR EMNLP OR ICCV OR ECCV OR AAAI OR IJCAI)
```

## 2. Top 10 AI/ML research conferences and open-access routes

The ordering is a cross-domain reference priority, not a claim that one field's venue dominates another. It intentionally covers general ML, NLP, vision, and broad AI.

| # | Conference | Primary coverage | Official site | Open proceedings / paper access | Fast search pattern |
|---:|---|---|---|---|---|
| 1 | **NeurIPS** | General ML; deep learning; optimization; generative AI; RL; systems | [conference](https://neurips.cc/) | [papers](https://proceedings.neurips.cc/) | `site:proceedings.neurips.cc "<topic>" 2025 OR 2026` |
| 2 | **ICML** | Core machine learning; theory; optimization; deep learning; RL | [conference](https://icml.cc/) | [papers](https://proceedings.mlr.press/) | `site:proceedings.mlr.press "<topic>" "International Conference on Machine Learning"` |
| 3 | **ICLR** | Representation learning; deep learning; foundation models; optimization | [conference](https://iclr.cc/) | [papers](https://openreview.net/group?id=ICLR.cc/2026/Conference) | `site:openreview.net/forum ICLR "<topic>"` |
| 4 | **ACL** | NLP; LLMs; language agents; evaluation; multilinguality | [conference](https://www.aclweb.org/) | [papers](https://aclanthology.org/venues/acl/) | `site:aclanthology.org/2026.acl "<topic>"` |
| 5 | **CVPR** | Computer vision; multimodal; generative vision; 3D; vision-language | [conference](https://cvpr.thecvf.com/) | [papers](https://openaccess.thecvf.com/CVPR2026) | `site:openaccess.thecvf.com/CVPR2026 "<topic>"` |
| 6 | **EMNLP** | Empirical NLP; LLMs; evaluation; retrieval; multilingual NLP | [conference](https://www.emnlp.org/) | [papers](https://aclanthology.org/venues/emnlp/) | `site:aclanthology.org "EMNLP" "<topic>"` |
| 7 | **ICCV** | Computer vision; multimodal; 3D; generative vision; recognition | [conference](https://iccv.thecvf.com/) | [papers](https://openaccess.thecvf.com/ICCV2025) | `site:openaccess.thecvf.com/ICCV2025 "<topic>"` |
| 8 | **ECCV** | Computer vision; vision-language; 3D; embodied vision; generative models | [conference](https://eccv.ecva.net/) | [papers](https://eccv.ecva.net/Conferences/2026/AcceptedPapers) | `site:eccv.ecva.net/Conferences/2026 "<topic>"` |
| 9 | **AAAI** | Broad AI; ML; planning; reasoning; agents; knowledge; applications | [conference](https://aaai.org/conference/aaai/) | [papers](https://ojs.aaai.org/index.php/aaai/) | `site:ojs.aaai.org/index.php/AAAI "<topic>" 2026` |
| 10 | **IJCAI** | Broad AI; agents; reasoning; ML; planning; knowledge representation | [conference](https://www.ijcai.org/) | [papers](https://www.ijcai.org/proceedings/2026/) | `site:ijcai.org/proceedings/2026 "<topic>"` |

### 2.1 Conference research workflow

```text
topic → venue proceedings → exact paper → supplementary/code → author/lab → citations/related work
```

For a new research topic:

1. Search the last 1–2 editions of **NeurIPS/ICML/ICLR** for the core method.
2. Search **ACL/EMNLP** if language, LLM behavior, retrieval, agents, or evaluation is central.
3. Search **CVPR/ICCV/ECCV** for vision, multimodality, video, 3D, embodied perception, or generative visual models.
4. Search **AAAI/IJCAI** for broader AI, reasoning, planning, knowledge, multi-agent systems, and application tracks.
5. Resolve the newest version on arXiv/OpenReview, then use the archival proceedings version for stable citation when available.

## 3. Top 10 open research / paper-discovery sources

This section interprets “open source like arXiv” as **open or programmatically accessible research-discovery infrastructure**, prioritizing direct paper access and reproducible search.

| # | Source | Best use | Entry point | Search/API | How to search |
|---:|---|---|---|---|---|
| 1 | **arXiv** | Primary preprint firehose for cs.AI/cs.LG/cs.CL/cs.CV/cs.RO/stat.ML | [home](https://arxiv.org/) | [search/API](https://arxiv.org/search/advanced) | Use Advanced Search; combine title/abstract/author/category. Example: cat:cs.LG AND ti:"reinforcement learning" |
| 2 | **OpenReview** | ICLR and many workshop/conference submissions, reviews, revisions, discussions | [home](https://openreview.net/) | [search/API](https://openreview.net/) | Search by title/author/venue; for exact venue use its group page, e.g. ICLR.cc/2026/Conference. |
| 3 | **PMLR** | Open proceedings for ICML, AISTATS, COLT and other ML venues | [home](https://proceedings.mlr.press/) | [search/API](https://proceedings.mlr.press/) | Query via site search or: site:proceedings.mlr.press "<topic>" "<venue>". |
| 4 | **NeurIPS Proceedings** | Canonical open NeurIPS paper archive | [home](https://proceedings.neurips.cc/) | [search/API](https://proceedings.neurips.cc/) | Query: site:proceedings.neurips.cc "<exact topic>" "<author>". |
| 5 | **ACL Anthology** | Canonical open NLP/CL archive for ACL-family venues | [home](https://aclanthology.org/) | [search/API](https://aclanthology.org/) | Use venue pages + browser search; query: site:aclanthology.org "<topic>" "<author>" 2026. |
| 6 | **CVF Open Access** | Open versions for CVPR/ICCV/WACV | [home](https://openaccess.thecvf.com/) | [search/API](https://openaccess.thecvf.com/) | Scope by venue/year path: site:openaccess.thecvf.com/CVPR2026 "<topic>". |
| 7 | **Semantic Scholar** | Paper graph, citations, related work, author disambiguation, OA-PDF filtering | [home](https://www.semanticscholar.org/) | [search/API](https://api.semanticscholar.org/api-docs/) | API: /graph/v1/paper/search?query=<topic>&year=2025-2026&openAccessPdf&fields=title,year,authors,citationCount,url |
| 8 | **OpenAlex** | Open scholarly graph with works/authors/institutions/topics and API filtering | [home](https://openalex.org/) | [search/API](https://help.openalex.org/api/) | API: /works?search=<topic>&filter=publication_year:2026,open_access.is_oa:true&sort=-cited_by_count |
| 9 | **DBLP** | Computer-science bibliography; author/venue identity and metadata verification | [home](https://dblp.org/) | [search/API](https://dblp.org/search) | Search exact author, venue acronym, or quoted paper title; use it to verify bibliographic identity before citation. |
| 10 | **Hugging Face Papers** | Daily/trending AI papers linked to models, code and community discussion | [home](https://huggingface.co/papers) | [search/API](https://huggingface.co/papers) | Search topic/model/lab; follow paper → model/dataset/code links, then verify the primary paper on arXiv/OpenReview/proceedings. |

### 3.1 Recommended paper-search cascade

```text
arXiv/OpenReview
    ↓ exact title / newest revision
conference proceedings
    ↓ archival venue version
Semantic Scholar / OpenAlex / DBLP
    ↓ citations, authors, institution, related work
GitHub / Hugging Face
    ↓ code, weights, configs, datasets
official lab blog / technical report
    ↓ implementation context and release-specific details
```

### 3.2 Search recipes

**arXiv advanced query examples**

```text
cat:cs.LG AND ti:"mixture of experts"
cat:cs.CL AND abs:"reinforcement learning" AND abs:"reasoning"
cat:cs.CV AND (ti:"world model" OR abs:"world model")
```

**Semantic Scholar API pattern**

```text
https://api.semanticscholar.org/graph/v1/paper/search
  ?query=<TOPIC>
  &year=2025-2026
  &openAccessPdf
  &fields=title,year,authors,venue,citationCount,url,openAccessPdf
```

**OpenAlex API pattern**

```text
https://api.openalex.org/works
  ?search=<TOPIC>
  &filter=publication_year:2026,open_access.is_oa:true
  &sort=-cited_by_count
```

## 4. Top 50 AI training + post-training + inference stack

This is a **systems-stack reference order**, not a benchmark ranking. The objective is end-to-end coverage from kernels/collectives → framework/distributed training → post-training → serving/runtime.

| # | System / project | Layer | Why it matters | Canonical docs/code |
|---:|---|---|---|---|
| 1 | **NVIDIA CUDA** | Accelerator runtime / programming model | NVIDIA GPU compute, kernels, streams, memory, graphs | [docs/code](https://docs.nvidia.com/cuda/) |
| 2 | **NVIDIA cuBLAS / cuBLASLt** | Dense linear algebra | GEMM primitives and low-level matmul tuning used by DL kernels | [docs/code](https://docs.nvidia.com/cuda/cublas/) |
| 3 | **NVIDIA cuDNN** | Deep-learning primitives | Attention/convolution/norm and graph-level DL kernels | [docs/code](https://docs.nvidia.com/deeplearning/cudnn/) |
| 4 | **NVIDIA NCCL** | Collective communication | AllReduce/AllGather/ReduceScatter/P2P for multi-GPU and multi-node training | [docs/code](https://docs.nvidia.com/deeplearning/nccl/) |
| 5 | **NVIDIA CUTLASS** | Kernel templates | Composable CUDA GEMM/attention primitives and architecture-specific kernels | [docs/code](https://github.com/NVIDIA/cutlass) |
| 6 | **Triton language** | Kernel DSL / compiler | Python-like GPU kernel authoring used by modern training/inference stacks | [docs/code](https://triton-lang.org/) |
| 7 | **NVIDIA Transformer Engine** | Low-precision transformer kernels | FP8/MXFP8/NVFP4 transformer layers for training and inference | [docs/code](https://docs.nvidia.com/deeplearning/transformer-engine/) |
| 8 | **AMD ROCm** | Accelerator software platform | AMD GPU compilers, runtimes, libraries, AI/HPC ecosystem | [docs/code](https://rocm.docs.amd.com/) |
| 9 | **AMD HIP** | GPU programming model | CUDA-like C++ runtime/kernel language for AMD portability | [docs/code](https://rocm.docs.amd.com/projects/HIP/en/latest/) |
| 10 | **AMD RCCL** | Collective communication | Multi-GPU/multi-node collectives on AMD GPUs | [docs/code](https://rocm.docs.amd.com/projects/rccl/en/latest/) |
| 11 | **ROCm Composable Kernel** | Kernel library | High-performance composable ML kernels for AMD GPUs | [docs/code](https://github.com/ROCm/composable_kernel) |
| 12 | **Intel oneAPI / oneDNN** | CPU/XPU primitives | Optimized DL primitives and heterogeneous compute path | [docs/code](https://www.intel.com/content/www/us/en/developer/tools/oneapi/onednn.html) |
| 13 | **Intel Gaudi / SynapseAI** | AI accelerator stack | Gaudi training/inference runtime, graph compiler and libraries | [docs/code](https://docs.habana.ai/en/latest/) |
| 14 | **Google TPU / XLA** | Accelerator + compiler | TPU-scale training with XLA/SPMD compilation | [docs/code](https://cloud.google.com/tpu/docs) |
| 15 | **PyTorch/XLA** | Framework accelerator bridge | PyTorch execution on XLA devices including TPU | [docs/code](https://docs.pytorch.org/xla/) |
| 16 | **AWS Trainium/Inferentia + Neuron** | Cloud accelerator stack | Training/inference compilation and runtime for AWS AI accelerators | [docs/code](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/) |
| 17 | **PyTorch** | Core training framework | Autograd, compile, distributed, checkpointing and model execution | [docs/code](https://pytorch.org/docs/stable/) |
| 18 | **JAX** | Functional ML framework | XLA-native transformations, SPMD and large-scale research training | [docs/code](https://docs.jax.dev/) |
| 19 | **PyTorch FSDP2** | Sharded data parallelism | Per-parameter sharding with composable distributed training APIs | [docs/code](https://docs.pytorch.org/docs/stable/distributed.fsdp.fully_shard.html) |
| 20 | **PyTorch DTensor / DeviceMesh** | Distributed tensor abstraction | N-D device meshes and tensor placements underlying composable parallelism | [docs/code](https://docs.pytorch.org/docs/stable/distributed.tensor.html) |
| 21 | **TorchTitan** | Reference large-scale trainer | PyTorch-native generative-model pretraining and multidimensional parallelism | [docs/code](https://github.com/pytorch/torchtitan) |
| 22 | **NVIDIA NeMo Framework** | Foundation-model training framework | Pretraining, fine-tuning, multimodal, distributed optimization | [docs/code](https://docs.nvidia.com/nemo-framework/index.html) |
| 23 | **NVIDIA Megatron-Core** | Large-scale transformer core | TP/PP/CP/EP, distributed optimizer, MoE and transformer scaling primitives | [docs/code](https://docs.nvidia.com/megatron-core/index.html) |
| 24 | **Megatron-LM** | Training reference stack | Large transformer training recipes built on Megatron techniques | [docs/code](https://github.com/NVIDIA/Megatron-LM) |
| 25 | **Microsoft DeepSpeed** | Distributed training/runtime | ZeRO, parallelism, offload, compression and inference optimizations | [docs/code](https://www.deepspeed.ai/) |
| 26 | **Hugging Face Transformers** | Model-definition layer | Canonical model implementations spanning training and inference ecosystems | [docs/code](https://huggingface.co/docs/transformers/) |
| 27 | **Hugging Face Accelerate** | Distributed launcher/abstraction | Portable multi-device/multi-node training across FSDP/DeepSpeed/XLA | [docs/code](https://huggingface.co/docs/accelerate/) |
| 28 | **Hugging Face PEFT** | Parameter-efficient tuning | LoRA and related adapter methods for economical fine-tuning | [docs/code](https://huggingface.co/docs/peft/) |
| 29 | **Hugging Face TRL** | Post-training / RL | SFT, DPO, GRPO, reward modeling and online/offline post-training | [docs/code](https://huggingface.co/docs/trl/) |
| 30 | **Axolotl** | Fine-tuning orchestration | Config-driven SFT/preference/RL-style tuning across common model families | [docs/code](https://docs.axolotl.ai/) |
| 31 | **LLaMA-Factory** | Fine-tuning platform | Unified SFT, PEFT, preference optimization and model adaptation workflows | [docs/code](https://llamafactory.readthedocs.io/) |
| 32 | **torchtune** | PyTorch post-training recipes | Native fine-tuning, preference optimization, quantization-aware workflows | [docs/code](https://docs.pytorch.org/torchtune/stable/) |
| 33 | **MosaicML LLM Foundry** | Training framework | Efficient LLM pretraining/fine-tuning recipes and distributed training | [docs/code](https://docs.mosaicml.com/projects/llm-foundry/) |
| 34 | **Colossal-AI** | Distributed training | Parallelism, memory optimization and large-model training infrastructure | [docs/code](https://colossalai.org/) |
| 35 | **Nanotron** | Research training stack | Minimal large-scale transformer pretraining framework from Hugging Face | [docs/code](https://github.com/huggingface/nanotron) |
| 36 | **OpenRLHF** | RLHF/post-training | Distributed RLHF stack integrating training and fast generation backends | [docs/code](https://github.com/OpenRLHF/OpenRLHF) |
| 37 | **verl** | RL post-training | Scalable reinforcement-learning framework for LLM reasoning/post-training | [docs/code](https://verl.readthedocs.io/en/latest/) |
| 38 | **NVIDIA NeMo RL** | RL post-training | Scalable RL and post-training integrated with NVIDIA model infrastructure | [docs/code](https://docs.nvidia.com/nemo/rl/latest/index.html) |
| 39 | **FlashAttention** | Attention kernel | IO-aware exact attention kernels reducing HBM traffic and improving throughput | [docs/code](https://github.com/Dao-AILab/flash-attention) |
| 40 | **Liger Kernel** | Training kernels | Triton-based memory-efficient kernels for LLM training/post-training | [docs/code](https://github.com/linkedin/Liger-Kernel) |
| 41 | **vLLM** | LLM inference engine | High-throughput serving, continuous batching, KV-cache management, distributed inference | [docs/code](https://docs.vllm.ai/) |
| 42 | **SGLang** | LLM/VLM serving engine | Low-latency/high-throughput serving, prefix caching and structured generation | [docs/code](https://docs.sglang.ai/) |
| 43 | **TensorRT-LLM** | NVIDIA LLM inference | TensorRT-optimized LLM engines, kernels, quantization and distributed serving | [docs/code](https://docs.nvidia.com/tensorrt-llm/) |
| 44 | **NVIDIA Triton Inference Server** | Model serving server | HTTP/gRPC serving, model repositories, dynamic batching and multi-backend deployment | [docs/code](https://docs.nvidia.com/triton-inference-server/) |
| 45 | **llama.cpp** | Portable local inference | C/C++ GGUF inference across CPU, CUDA, ROCm/HIP, Metal, Vulkan and other backends | [docs/code](https://github.com/ggml-org/llama.cpp) |
| 46 | **Hugging Face Text Generation Inference (TGI)** | LLM serving | Production text-generation serving integrated with Hugging Face models | [docs/code](https://huggingface.co/docs/text-generation-inference/) |
| 47 | **LMDeploy** | LLM/VLM inference | TurboMind/PyTorch serving, quantization and deployment for open models | [docs/code](https://lmdeploy.readthedocs.io/) |
| 48 | **ONNX Runtime** | Cross-platform inference runtime | Graph optimization and heterogeneous execution providers | [docs/code](https://onnxruntime.ai/docs/) |
| 49 | **OpenVINO** | Intel inference toolkit | Model optimization and inference on Intel CPU/GPU/NPU | [docs/code](https://docs.openvino.ai/) |
| 50 | **Apple MLX / MLX-LM** | Apple Silicon training/inference | Unified-memory array framework and LLM tooling optimized for Apple Silicon | [docs/code](https://ml-explore.github.io/mlx/) |

### 4.1 Stack dependency map

```text
ACCELERATOR / DRIVER / COMPILER
  NVIDIA CUDA | AMD ROCm/HIP | Intel Gaudi/oneAPI | TPU/XLA | AWS Neuron
              ↓
KERNELS / NUMERICS / COLLECTIVES
  cuBLASLt | cuDNN | CUTLASS | Triton-lang | Transformer Engine
  NCCL | RCCL | Composable Kernel | FlashAttention | Liger
              ↓
MODEL / AUTOGRAD FRAMEWORK
  PyTorch | JAX | PyTorch/XLA
              ↓
DISTRIBUTED TRAINING
  FSDP2 | DTensor | TorchTitan | Megatron-Core | DeepSpeed
  NeMo | Megatron-LM | LLM Foundry | Colossal-AI | Nanotron
              ↓
MODEL DEFINITION / ADAPTATION
  Transformers | Accelerate | PEFT | Axolotl | LLaMA-Factory | torchtune
              ↓
POST-TRAINING / RL
  TRL | OpenRLHF | verl | NeMo RL
              ↓
INFERENCE ENGINE
  vLLM | SGLang | TensorRT-LLM | llama.cpp | LMDeploy | TGI
              ↓
SERVING / PORTABLE RUNTIME
  Triton Inference Server | ONNX Runtime | OpenVINO | MLX/MLX-LM
```

### 4.2 What to inspect for any training stack

| Dimension | What to verify |
|---|---|
| Parallelism | DP/FSDP, TP, PP, CP/SP, EP/MoE; topology and composability |
| Precision | BF16/FP16, FP8, MXFP8, FP4/NVFP4, INT8/INT4; accumulation and optimizer precision |
| Memory | activation checkpointing, sharding, offload, optimizer state, sequence packing |
| Communication | collective algorithm, overlap, NVLink/NVSwitch/IB/RoCE/xGMI path, bucket sizes |
| Kernels | attention, GEMM, fused MLP/norm, MoE dispatch, quantization/dequantization |
| Checkpointing | distributed checkpoint format, resharding, async save, restart semantics |
| Post-training | SFT, RM, DPO, GRPO/PPO-family, online generation, actor/reference/reward placement |
| Inference | continuous batching, paged/prefix KV cache, speculative decoding, quantization, distributed serving |
| Metrics | MFU, FLOP/s, HBM BW, network BW, tokens/s/GPU, TTFT, TPOT, ITL, p50/p95/p99 E2E |
| Reliability | OOM recovery, straggler behavior, node failure, checkpoint restore, version compatibility |
| Reproducibility | exact commit, container, driver/runtime version, model revision, tokenizer, kernel flags |

### 4.3 Training-stack search protocol

```text
# Official documentation first
"<SYSTEM>" official documentation distributed training

# Architecture and algorithm details
site:github.com "<SYSTEM>" (architecture OR design OR RFC OR benchmark)

# Performance evidence
"<SYSTEM>" (throughput OR MFU OR tokens/s OR TTFT OR TPOT) "<GPU_OR_ACCELERATOR>"

# Compatibility
"<SYSTEM>" "<MODEL>" "<HARDWARE>" "<VERSION>"

# Failure/debug path
site:github.com "<SYSTEM>" (OOM OR deadlock OR NCCL OR RCCL OR checkpoint OR hang)
```

## 5. Minimal maintenance policy for this index

Update the file on a fixed cadence rather than continuously rewriting its taxonomy:

- **Weekly:** Artificial Analysis/LMArena frontier changes; major model releases; inference engine releases.
- **Monthly:** lab links, new technical reports, major training-stack versions, model-hub/code migrations.
- **Per conference cycle:** proceedings URLs and accepted-paper indexes.
- **Quarterly:** re-evaluate the top-50 lab ordering using the same composite signals; do not silently change the methodology.

When a URL disappears, replace it with the lab/project's new canonical endpoint and retain the conceptual slot. When a project is superseded, keep the old entry only if it remains necessary to reproduce important papers or systems.

---

## 6. Source notes used to build this snapshot

- Stanford AI Index 2026 reports that industry produced over 90% of notable AI models in 2025 and identifies OpenAI, Google and Alibaba among the largest 2025 contributors: https://hai.stanford.edu/ai-index/2026-ai-index-report/research-and-development
- Epoch AI maintains downloadable model and company datasets and explicit organization fields: https://epoch.ai/data/ai-models and https://epoch.ai/data/ai-companies
- Artificial Analysis exposes current model-provider comparisons across intelligence, cost, speed, latency and openness: https://artificialanalysis.ai/models/
- Official open proceedings used here include NeurIPS Proceedings, PMLR, ACL Anthology, CVF Open Access, AAAI OJS and IJCAI Proceedings.
- Training/inference entries point to canonical vendor/project documentation wherever a stable documentation endpoint exists.

**End of file.**