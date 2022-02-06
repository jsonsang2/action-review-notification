import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'
// eslint-disable-next-line sort-imports
import {
  IncomingWebhook,
  IncomingWebhookDefaultArguments,
  IncomingWebhookSendArguments
} from '@slack/webhook'

export const Success = 'success'
type SuccessType = 'success'
export const Failure = 'failure'
type FailureType = 'failure'
export const Cancelled = 'cancelled'
type CancelledType = 'cancelled'
export const Custom = 'custom'
export const Always = 'always'
type AlwaysType = 'always'

export type Octokit = InstanceType<typeof GitHub>

export interface With {
  status: string
  mention: string
  author_name: string
  if_mention: string
  username: string
  icon_emoji: string
  icon_url: string
  channel: string
  fields: string
  job_name: string
}

const groupMention = ['here', 'channel']
const subteamMention = 'subteam^'

export class Client {
  private webhook: IncomingWebhook
  private octokit: Octokit
  private with: With

  constructor(
    props: With,
    token: string,
    gitHubBaseUrl: string,
    webhookUrl?: string | null
  ) {
    this.with = props
    this.octokit = getOctokit(token)

    if (webhookUrl === undefined || webhookUrl === null || webhookUrl === '') {
      throw new Error('Specify secrets.SLACK_WEBHOOK_URL')
    }

    const options: IncomingWebhookDefaultArguments = {}

    this.webhook = new IncomingWebhook(webhookUrl, options)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async custom(payload: string) {
    /* eslint-disable no-var */
    var template: IncomingWebhookSendArguments = eval(`template = ${payload}`)
    /* eslint-enable */
    return template
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async prepare(text: string) {
    const template = await this.payloadTemplate()
    template.text = this.injectText(text)
    template.attachments[0].color = this.injectColor()
    return template
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async send(payload: string | IncomingWebhookSendArguments) {
    core.debug(JSON.stringify(context, null, 2))
    await this.webhook.send(payload)
    core.debug('send message')
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  injectColor() {
    switch (this.with.status) {
      case Success:
        return 'good'
      case Cancelled:
        return 'warning'
      case Failure:
        return 'danger'
    }
    throw new Error(`invalid status: ${this.with.status}`)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  injectText(value: string) {
    let text = ''
    switch (this.with.status) {
      case Success:
        text += this.mentionText(Success)
        text += this.insertText(
          ':white_check_mark: Succeeded GitHub Actions\n',
          value
        )
        return text
      case Cancelled:
        text += this.mentionText(Cancelled)
        text += this.insertText(':warning: Canceled GitHub Actions\n', value)
        return text
      case Failure:
        text += this.mentionText(Failure)
        text += this.insertText(':no_entry: Failed GitHub Actions\n', value)
        return text
    }
    throw new Error(`invalid status: ${this.with.status}`)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  mentionText(status: SuccessType | FailureType | CancelledType | AlwaysType) {
    const {mention, if_mention} = this.with
    if (!if_mention.includes(status) && if_mention !== Always) {
      return ''
    }

    const normalized = mention.replace(/ /g, '')
    if (normalized !== '') {
      const text = normalized
        .split(',')
        .map(id => this.getIdString(id))
        .join(' ')
      return `${text} `
    }
    return ''
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private insertText(defaultText: string, text: string) {
    return text === '' ? defaultText : text
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private async payloadTemplate() {
    const text = ''
    const {username, icon_emoji, icon_url, channel} = this.with

    return {
      text,
      username,
      icon_emoji,
      icon_url,
      channel,
      attachments: [
        {
          color: '',
          author_name: this.with.author_name
        }
      ]
    }
  }

  private getIdString(id: string): string {
    if (id.includes(subteamMention) || groupMention.includes(id))
      return `<!${id}>`

    return `<@${id}>`
  }
}
