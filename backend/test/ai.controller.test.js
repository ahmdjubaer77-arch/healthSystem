const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createAiController } = require('../src/controllers/ai.controller')

function createResponse() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    destroyed: false,
    writableEnded: false,
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    set(headers) {
      Object.assign(this.headers, headers)
      return this
    },
    setHeader(name, value) {
      this.headers[name] = value
    },
    flushHeaders() {},
    write(chunk) {
      this.body += chunk
      return true
    },
    end() {
      this.writableEnded = true
      return this
    },
    once() { return this },
  }
}

function createRequest(body, user = undefined) {
  return {
    body,
    user,
    headers: { 'x-request-id': 'a2fdd40c-5be1-4c6c-9a4f-714018a414be' },
    get(name) { return this.headers[name.toLowerCase()] },
    once() { return this },
  }
}

test('requires explicit consent before contacting the provider', async () => {
  let called = false
  let nextError
  const controller = createAiController({
    geminiService: {
      async *stream() {
        called = true
        yield { type: 'delta', text: 'unexpected' }
      },
    },
  })

  await controller.chat(
    createRequest({ message: 'sleep routine', consent: false }),
    createResponse(),
    (error) => { nextError = error },
  )

  assert.equal(called, false)
  assert.equal(nextError.statusCode, 400)
  assert.equal(nextError.code, 'CONSENT_REQUIRED')
})

test('requires consent and forwards general conversation context after consent', async () => {
  let serviceRequest
  let nextError
  const response = createResponse()
  const controller = createAiController({
    geminiService: {
      async *stream(request) {
        serviceRequest = request
        yield { type: 'delta', text: 'A closure remembers the variables around it.' }
      },
    },
  })

  await controller.chat(
    createRequest({
      message: 'Can you explain that simply?',
      conversation: [
        { role: 'user', text: 'What is a closure in JavaScript?' },
        { role: 'assistant', text: 'It lets a function remember variables from its outer scope.' },
      ],
      consent: true,
      userId: 'frontend-supplied-id',
    }, { userId: 'trusted-authenticated-id' }),
    response,
    (error) => { nextError = error },
  )

  assert.equal(nextError, undefined)
  assert.deepEqual(serviceRequest, {
    topic: 'general_chat',
    language: 'en',
    message: 'Can you explain that simply?',
    history: [
      { role: 'user', text: 'What is a closure in JavaScript?' },
      { role: 'assistant', text: 'It lets a function remember variables from its outer scope.' },
    ],
  })
  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['X-Request-ID'], 'a2fdd40c-5be1-4c6c-9a4f-714018a414be')
  assert.match(response.body, /event: delta/)
  assert.match(response.body, /A closure remembers the variables around it\./)
  assert.match(response.body, /"urgent":false/)
})

test('returns urgent guidance as an emergency state', async () => {
  let serviceRequest
  let nextError
  const response = createResponse()
  const controller = createAiController({
    geminiService: {
      async *stream(request) {
        serviceRequest = request
        yield { type: 'delta', text: 'Please contact local emergency services now.' }
      },
    },
  })

  await controller.chat(
    createRequest({ message: 'I am having trouble breathing', consent: false }),
    response,
    (error) => { nextError = error },
  )

  assert.equal(nextError, undefined)
  assert.deepEqual(serviceRequest, { topic: 'urgent_support', language: 'en', history: [] })
  assert.match(response.body, /"urgent":true/)
})

test('forwards the selected reply language to the assistant service', async () => {
  let serviceRequest
  const response = createResponse()
  const controller = createAiController({
    geminiService: {
      async *stream(request) {
        serviceRequest = request
        yield { type: 'delta', text: 'হ্যালো!' }
      },
    },
  })

  await controller.chat(
    createRequest({ message: 'Hello!', language: 'bn', consent: true }),
    response,
    (error) => { throw error },
  )

  assert.equal(serviceRequest.language, 'bn')
  assert.match(response.body, /"language":"bn"/)
})
