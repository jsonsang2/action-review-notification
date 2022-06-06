import * as core from '@actions/core'
import {Client} from './client'
const github = require('@actions/github');

async function run(): Promise<void> {
  try {
    const status: string = core.getInput('status')
    const mention = core.getInput('mention')
    const author_name = core.getInput('author_name')
    const if_mention = core.getInput('if_mention').toLowerCase()
    const username = core.getInput('username')
    const icon_emoji = core.getInput('icon_emoji')
    const icon_url = core.getInput('icon_url')
    const channel = core.getInput('channel')
    const custom_payload = core.getInput('custom_payload')
    const fields = core.getInput('fields')
    const job_name = core.getInput('job_name')
    const github_token = core.getInput('github_token')
    const github_base_url = core.getInput('github_base_url')

    core.debug(`Print ${status} ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    //await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())

    const client = new Client(
      {
        status,
        mention,
        author_name,
        if_mention,
        username,
        icon_emoji,
        icon_url,
        channel,
        fields,
        job_name
      },
      github_token,
      github_base_url,
      process.env.SLACK_WEBHOOK_URL
    )

    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.debug(`The event payload: ${payload}`)

    await client.send(payload)
    //await client.send(await client.prepare(custom_payload));
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
