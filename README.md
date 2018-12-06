# Nomisma Backend Code Challenge
> repo for nomisma backend code challenge

## Overview

This is a project for nomisma backend code challenge. Read the challenge guideline at docs section.

Build with `Express`

## Design

### Schedule

The schedule should be decoupled from specific business logic in order to reuse. 

So it has an executor option to define what you want to do, sending email or doing something else.

### Email Service

The email service should like an `adapter`, provide consistent interface for different email service providers.

And should not care about which email service is actually used when call it from outside.

## Links

Production: http://raychenfj.me:3007

## API

### list tasks

url: /api/v1/tasks

method: GET

output: 
```js
[
  {
    "to": "example@example.com",  // recipient's email
    "content": "hello world", // email content
    "subject": "hello world", // email subject
    "timestamp": 1544065545639, // timestamp, when the email should be send
    "immediate": false, // send it immediately
    "id": "88672290-ba4a-4689-aaba-c6924ea00b88", // auto-gen uuid
    "status": "complete", // status, can be pending/complete/fail
    "retry": 0 // retry times
  }
]
```

### create new task

url: /api/v1/tasks

method: POST

output:

will send `schedule task successfully` when success

## Install

```bash
npm run install
# or
yarn
```

## Test
```bash
npm run test
```

## Run
```bash
# run in development env
npm run start:dev

# run in production env
npm run start:production
```

## Deploy with Docker
```bash
bash publish.sh
```

## Some Other Thoughts

### Producer Consumer Pattern

Can re-implement this email service by using producer consumer pattern. Can provide improve performance when payload and concurrency are high.

The web service works as producer, it constantly add new tasks to some queue, like `RabbitMQ`.

And the schedule as a worker or consumer, constantly fetch tasks from queue when it's idle or payload is low.

Create more producers and consumers to scale.

### OpenApi

Doc in OpenApi can provide some benefits. 

It's json format and be easily parsed.

What I come up with is auto-generating some frontend api code.

## Docs

[Guidelines](https://github.com/NomismaTech/coding-challenge-tools/blob/master/coding_challenge.md)
