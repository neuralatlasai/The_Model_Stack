import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { STACK_LAYERS } from '@atlas/core';
import { labIdFor, parseReferenceStack, systemIdFor, type ReferenceStack } from '../../src/registry/reference-stack.ts';
import { must } from './fixtures.ts';
import { REFERENCE_STACK } from './paths.ts';

describe('parseReferenceStack (real Instruction/AI_REFERENCE_STACK.md, read-only)', () => {
  let stack: ReferenceStack;

  before(async () => {
    stack = parseReferenceStack(await readFile(REFERENCE_STACK, 'utf8'), '../Instruction/AI_REFERENCE_STACK.md');
  });

  it('parses 50 labs and 50 systems with ranks 1..50 and no diagnostics', () => {
    assert.equal(stack.labs.length, 50);
    assert.equal(stack.systems.length, 50);
    assert.deepEqual(
      stack.labs.map((lab) => lab.rank),
      Array.from({ length: 50 }, (_, index) => index + 1),
    );
    assert.deepEqual(
      stack.systems.map((system) => system.rank),
      Array.from({ length: 50 }, (_, index) => index + 1),
    );
    assert.deepEqual(stack.diagnostics, []);
  });

  it('derives impl ids from the exact §4 names as the docs use them', () => {
    const ids = new Set(stack.systems.map((system) => system.id));
    for (const id of [
      'impl.vllm',
      'impl.sglang',
      'impl.tensorrt-llm',
      'impl.llama-cpp',
      'impl.pytorch',
      'impl.flashattention',
      'impl.nvidia-cublas-cublaslt',
      'impl.pytorch-fsdp2',
      'impl.pytorch-dtensor-devicemesh',
      'impl.nvidia-megatron-core',
      'impl.hugging-face-trl',
      'impl.hugging-face-transformers',
      'impl.mosaicml-llm-foundry',
      'impl.verl',
      'impl.amd-rccl',
    ]) {
      assert.ok(ids.has(id as never), id);
    }
    assert.equal(systemIdFor('Triton language'), 'impl.triton-language');
    assert.equal(systemIdFor('NVIDIA Triton Inference Server'), 'impl.nvidia-triton-inference-server');
  });

  it('places every system in exactly one §4.1 stack layer', () => {
    for (const system of stack.systems) assert.ok(system.layer !== null && STACK_LAYERS.includes(system.layer), system.name);
    const layerOf = (name: string): string | null => stack.systems.find((system) => system.name === name)?.layer ?? null;
    assert.equal(layerOf('vLLM'), 'Inference engine');
    assert.equal(layerOf('FlashAttention'), 'Kernels / numerics / collectives');
    assert.equal(layerOf('PyTorch'), 'Model / autograd framework');
    assert.equal(layerOf('PyTorch FSDP2'), 'Distributed training');
    assert.equal(layerOf('Hugging Face TRL'), 'Post-training / RL');
    assert.equal(layerOf('NVIDIA NeMo Framework'), 'Distributed training');
    assert.equal(layerOf('NVIDIA NeMo RL'), 'Post-training / RL');
    assert.equal(layerOf('AMD HIP'), 'Accelerator / driver / compiler');
    assert.equal(layerOf('Apple MLX / MLX-LM'), 'Serving / portable runtime');
    assert.equal(layerOf('NVIDIA Triton Inference Server'), 'Serving / portable runtime');
    assert.equal(layerOf('Triton language'), 'Kernels / numerics / collectives');
  });

  it('keeps surfaces exactly as listed', () => {
    const vllm = stack.systems.find((system) => system.id === 'impl.vllm');
    assert.deepEqual(vllm?.surfaces, [{ label: 'docs/code', url: 'https://docs.vllm.ai/' }]);
    const anthropic = must(stack.labs.find((lab) => lab.rank === 1));
    assert.equal(anthropic.name, 'Anthropic');
    assert.equal(anthropic.id, 'lab.anthropic');
    assert.deepEqual(
      anthropic.surfaces.map((surface) => surface.label),
      ['Home', 'Research', 'Papers', 'Blog', 'Code', 'Models'],
    );
  });

  it('uses the contract ids for labs, with the mechanical id as an alias', () => {
    assert.equal(labIdFor('Z.ai / Zhipu AI / GLM'), 'lab.z-ai-glm');
    assert.equal(labIdFor('Moonshot AI / Kimi'), 'lab.moonshot-ai-kimi');
    assert.equal(labIdFor('Google DeepMind'), 'lab.google-deepmind');
    assert.equal(stack.aliases.get('lab.z-ai-zhipu-ai-glm'), 'lab.z-ai-glm');
    assert.equal(stack.aliases.get('lab.alibaba-qwen'), 'lab.alibaba-qwen');
    assert.equal(stack.aliases.get('impl.flashmla'), undefined);
  });

  it('diagnoses a malformed stack instead of throwing', () => {
    const broken = parseReferenceStack('# Nothing here\n\nNo tables.\n', 'stack.md');
    assert.equal(broken.labs.length, 0);
    assert.ok(broken.diagnostics.length >= 2);
    assert.ok(broken.diagnostics.every((item) => item.code === 'reference-stack-parse'));
  });
});
