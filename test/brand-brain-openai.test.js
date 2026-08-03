import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSynthesisRequest,
  collectChatCompletionStream,
  extractChatCompletionText,
} from "../src/brand-brain/chat-completions-provider.js";
import { normalizeSourcesForSynthesis } from "../src/brand-brain/source-normalizer.js";
import {
  OPENAI_IMAGE_EDITS_ENDPOINT,
  OPENAI_IMAGE_GENERATIONS_ENDPOINT,
  buildOpenAIImageEditRequest,
  buildOpenAIImageGenerationRequest,
  chooseOpenAIImageEndpoint,
} from "../src/renderers/openai-images.js";
import { assertSafeRemoteUrl } from "../scripts/dev-server.js";

test("Chat Completions synthesis preserves authority, normalized document text, and image evidence", () => {
  const request = buildSynthesisRequest([
    {
      id: "approved-guidance",
      name: "Approved strategy",
      type: "Files",
      detail: "strategy.pdf and logo.png",
      authority: "approved-guidance",
      role: "Brand foundation",
      influence: "Not weighted",
      usage: "Follow the signed-off positioning.",
      exclusions: "Ignore workshop alternatives.",
      content: "SOURCE FILE: strategy.pdf\nApproved positioning text.",
      extractedFiles: [{ kind: "text", name: "strategy.pdf", type: "application/pdf", size: 12 }],
      files: [{ kind: "image", name: "logo.png", type: "image/png", size: 12, data: "data:image/png;base64,AAAA" }],
    },
  ]);

  assert.equal(request.model, "gpt-5.6");
  assert.equal(request.store, false);
  assert.equal(request.stream, true);
  assert.deepEqual(request.stream_options, { include_usage: true });
  assert.equal(request.response_format.type, "json_schema");
  assert.equal(request.response_format.json_schema.strict, true);
  const content = request.messages[1].content;
  assert.match(content[0].text, /approved-guidance/);
  assert.match(content[0].text, /Follow the signed-off positioning/);
  assert.match(content[0].text, /Approved positioning text/);
  assert.deepEqual(content[1], {
    type: "image_url",
    image_url: { url: "data:image/png;base64,AAAA", detail: "high" },
  });
  assert.doesNotMatch(JSON.stringify(request), /input_file|input_text|text\.format/);
});

test("raw Chat Completions JSON is extracted without an SDK helper", () => {
  const output = extractChatCompletionText({
    choices: [{ message: { role: "assistant", content: "{\"brandName\":\"SLAKE\"}" } }],
  });
  assert.equal(output, '{"brandName":"SLAKE"}');
});

test("streamed Chat Completions output is reassembled with usage metadata", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"id":"chatcmpl_live","model":"gpt-5.6","choices":[{"delta":{"content":"{\\"brand"}}]}\n\n'));
      controller.enqueue(encoder.encode('data: {"id":"chatcmpl_live","model":"gpt-5.6","choices":[{"delta":{"content":"Name\\":\\"Fallow\\"}"}}]}\r\n\r\n'));
      controller.enqueue(encoder.encode('data: {"id":"chatcmpl_live","model":"gpt-5.6","choices":[],"usage":{"total_tokens":42}}\n\ndata: [DONE]\n\n'));
      controller.close();
    },
  });

  const completion = await collectChatCompletionStream(stream);
  assert.equal(completion.id, "chatcmpl_live");
  assert.equal(completion.model, "gpt-5.6");
  assert.equal(completion.choices[0].message.content, '{"brandName":"Fallow"}');
  assert.deepEqual(completion.usage, { total_tokens: 42 });
});

test("plain-text uploads are normalized before they reach synthesis", async () => {
  const data = `data:text/plain;base64,${Buffer.from("Approved: make ordinary moments feel considered.").toString("base64")}`;
  const [source] = await normalizeSourcesForSynthesis([
    { id: "note", name: "Approved note", content: "", files: [{ name: "note.txt", type: "text/plain", size: 48, data }] },
  ]);
  assert.match(source.content, /Approved: make ordinary moments feel considered/);
  assert.equal(source.files.length, 0);
  assert.equal(source.extractedFiles[0].kind, "text");
});

test("OpenAI image routing preserves the compiled prompt exactly", () => {
  const prompt = "STYLE ANCHOR\nExact tuned fragment; preserve punctuation and spacing.";
  const generation = buildOpenAIImageGenerationRequest({ prompt });
  assert.equal(generation.endpoint, OPENAI_IMAGE_GENERATIONS_ENDPOINT);
  assert.equal(generation.body.prompt, prompt);
  assert.equal(chooseOpenAIImageEndpoint([]), OPENAI_IMAGE_GENERATIONS_ENDPOINT);

  const edit = buildOpenAIImageEditRequest({
    prompt,
    referenceImages: [{ name: "canonical.png", type: "image/png", data: "data:image/png;base64,AAAA" }],
  });
  assert.equal(edit.endpoint, OPENAI_IMAGE_EDITS_ENDPOINT);
  assert.equal(edit.body.get("prompt"), prompt);
  assert.equal(chooseOpenAIImageEndpoint([{ name: "canonical.png" }]), OPENAI_IMAGE_EDITS_ENDPOINT);
});

test("URL intake rejects local and private network targets", async () => {
  await assert.rejects(() => assertSafeRemoteUrl("http://127.0.0.1:4173/private"), /Private network URLs/);
  await assert.rejects(() => assertSafeRemoteUrl("http://localhost:4173/private"), /Local network URLs/);
});
