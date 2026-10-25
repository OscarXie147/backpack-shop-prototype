# 背包导购原型

一次性界面原型，用来看 DSR 研究步骤 0 的实验平台大概长什么样。它不是正式实验平台。

流程：任务说明 → 网店（两种布局）→ 购物助手 → 结算 → Gu (2018) 标签页 → 9 题量表 → 结束页（显示全部行为埋点）。

- 网页：`index.html`，由 GitHub Pages 发布。
- 助手：硅基流动的免费模型，通过 `worker/` 里的 Cloudflare Worker 转发。API key 只存在 Worker 的加密变量里，不进仓库。
- 24 款背包是占位数据，没有按占优结构构造。量表中文为暂译，未经回译。

## 部署 Worker

```
cd worker
npx wrangler login
npx wrangler secret put SF_KEY     # 粘贴硅基流动 API key
npx wrangler deploy
```

部署后把输出的 `https://backpack-shop-proxy.<子域>.workers.dev` 填进 `index.html` 里的 `WORKER_URL`。
换模型就改 `wrangler.toml` 里的 `MODEL`，要选控制台里同时标着「免费」和「Tools」的模型。
