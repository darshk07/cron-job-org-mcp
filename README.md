# cronjob-org-mcp

An [MCP](https://modelcontextprotocol.io) server for [cron-job.org](https://cron-job.org)'s REST API. Lets any MCP-compatible client (Claude, Claude Code, etc.) create, inspect, update, and delete cron jobs and folders, and read execution history, using natural language.

## Tools

| Tool | Description |
| --- | --- |
| `list_jobs` | List all cron jobs |
| `get_job` | Get full details for one job |
| `create_job` | Create a new job |
| `update_job` | Update an existing job |
| `delete_job` | Delete a job |
| `get_job_history` | List recent executions + predicted next runs |
| `get_history_item` | Get full details of one execution |
| `list_folders` | List folders |
| `get_folder` | Get one folder |
| `create_folder` | Create a folder |
| `update_folder` | Rename a folder |
| `delete_folder` | Delete a folder |

## Setup

1. Get an API key from your [cron-job.org console](https://console.cron-job.org/) under **Settings > API**.
2. Add the server to your MCP client's config, for example in Claude Desktop's `claude_desktop_config.json` or Claude Code's MCP settings:

```json
{
  "mcpServers": {
    "cronjob-org": {
      "command": "npx",
      "args": ["-y", "cronjob-org-mcp"],
      "env": {
        "CRONJOB_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

3. Restart your client. The tools above should now be available.

## Notes

- The free cron-job.org tier is limited to 100 API requests/day (5,000/day for sustaining members). Bulk operations may hit this limit.
- `create_job` and `update_job` accept a `schedule` object (`hours`, `minutes`, `mdays`, `months`, `wdays`, each `[-1]` for "every"), plus `timezone`, `auth` (HTTP basic auth), `notification` (failure/recovery/cert-expiry alerts), and `headers`/`body` for the request payload. Only `url` is required to create a job.
- `requestMethod` is numeric: `0`=GET, `1`=POST, `2`=OPTIONS, `3`=HEAD, `4`=PUT, `5`=DELETE, `6`=TRACE, `7`=CONNECT, `8`=PATCH.

## Development

```bash
npm install
npm run build
cp .env.example .env   # then edit .env and paste in your API key
npm run inspector      # launch the MCP Inspector against the built server
```

The `.env` file is picked up automatically — no need to export environment variables in your shell. It's git-ignored, so your key never gets committed.

## License

MIT
