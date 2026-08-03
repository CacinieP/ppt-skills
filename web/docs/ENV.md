# 环境变量配置手册

本项目只需要 3 个环境变量,**仅 `OPENAI_API_KEY` 必填**。任何 OpenAI 兼容的聊天补全服务都能用。

> 所有变量都在**服务端**(`/api/generate` route handler)读取,从不暴露给浏览器。前端代码无法访问这些值。

---

## 变量总览

| 变量 | 必填 | 默认值 | 作用 |
|---|:---:|---|---|
| `OPENAI_API_KEY` | ✅ | — | 模型服务的 API 密钥 |
| `OPENAI_BASE_URL` | ❌ | `https://open.bigmodel.cn/api/paas/v4` | OpenAI 兼容接口的根地址 |
| `OPENAI_MODEL` | ❌ | `glm-4-plus` | 调用的模型名,必须支持 `response_format: json_object` |

代码里实际拼出的请求地址是:`${OPENAI_BASE_URL}/chat/completions`。所以 `OPENAI_BASE_URL` 填到 `/v4` 或 `/v1` 这一级,**不要**带末尾的 `/chat/completions`。

---

## 一、本地开发(macOS / Linux)

### 步骤

```bash
cd ~/Developer/pptx-web

# 1) 复制示例文件
cp .env.example .env.local

# 2) 编辑 .env.local,填入你的 key
#    （用任意编辑器,下面用 cat 展示格式）
```

`.env.local` 格式(**等号两边不要加引号**):

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

```bash
# 3) 启动开发服务器（Next 会自动读取 .env.local）
npm run dev
```

改完 `.env.local` 后**必须重启 dev server**(Ctrl+C 后重新 `npm run dev`),环境变量不会热更新。

### 验证是否生效

启动后访问 `http://localhost:3210`,填主题点「生成」:

- 返回 `服务器未配置 OPENAI_API_KEY` → key 没被读到(检查文件名是不是 `.env.local`、是否在项目根目录)
- 返回 `模型调用失败 (401)` → key 错误或过期
- 返回 `模型调用失败 (404)` → `OPENAI_BASE_URL` 或 `OPENAI_MODEL` 填错
- 开始下载 `.pptx` → 配置成功 ✅

### ⚠️ 关于代理(中国大陆网络)

如果你的 `.npmrc` 或 shell 里设了 HTTP 代理(`127.0.0.1:7890` 之类),可能影响服务端对模型的调用:

- **调 bigmodel(智谱)**:这是国内主机,**不要走代理**。启动前确认代理关闭:
  ```bash
  unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
  npm run dev
  ```
- **调 OpenAI / Anthropic 等境外服务**:**需要代理**。反过来要确保代理开启:
  ```bash
  export HTTPS_PROXY=http://127.0.0.1:7890
  npm run dev
  ```

判断方法:看 `npm run dev` 启动后,点生成时终端日志里如果卡住很久没响应,多半是代理方向搞反了。

---

## 二、各家服务商怎么填

所有填写都遵循同一规则:`OPENAI_BASE_URL` 填到版本号那一级,**不带** `/chat/completions`。

### 智谱 BigModel(默认,推荐国内用户)

```bash
OPENAI_API_KEY=你的智谱key        # 在 bigmodel.cn 控制台获取
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
OPENAI_MODEL=glm-4-plus           # 或 glm-4-flash(更快/更便宜)
```

### OpenAI 官方

```bash
OPENAI_API_KEY=sk-...             # platform.openai.com 获取
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini          # 或 gpt-4o
```

### DeepSeek

```bash
OPENAI_API_KEY=sk-...             # platform.deepseek.com 获取
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### 月之暗面 Moonshot (Kimi)

```bash
OPENAI_API_KEY=sk-...             # platform.moonshot.cn 获取
OPENAI_BASE_URL=https://api.moonshot.cn/v1
OPENAI_MODEL=moonshot-v1-8k       # 或 moonshot-v1-32k / moonshot-v1-128k
```

### 阿里通义千问 DashScope

```bash
OPENAI_API_KEY=sk-...             # bailian.console.aliyun.com 获取
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-plus            # 或 qwen-turbo / qwen-max
```

### 本地模型(Ollama / vLLM / LM Studio)

```bash
OPENAI_API_KEY=ollama             # 占位符,本地服务通常不校验,但不能为空
OPENAI_BASE_URL=http://localhost:11434/v1   # Ollama 默认端口
OPENAI_MODEL=qwen2.5:7b           # 你本地 pull 的模型名
```

> 本地模型必须支持 `response_format: json_object`(JSON 模式),否则会返回纯文本导致解析失败。Ollama 较新版本支持;不支持的话换云端模型。

---

## 三、常见报错对照

| 报错信息 | 原因 | 解决 |
|---|---|---|
| `服务器未配置 OPENAI_API_KEY` | 环境变量没读到 | 检查 `.env.local` 文件名/位置;重启 dev server |
| `模型调用失败 (401)` | key 错误/过期 | 重新生成 key |
| `模型调用失败 (403)` | key 无该模型权限,或被风控 | 换模型或检查账户 |
| `模型调用失败 (404)` | base_url 或 model 名拼错 | 对照上方服务商表 |
| `模型调用失败 (429)` | 并发/额度超限 | 稍后重试或升级套餐 |
| 超时 / 长时间无响应 | 代理方向反了,或模型太慢 | 见「关于代理」一节;或换更快模型 |
| `生成的大纲无效` | 模型没返回合法 JSON | 该模型可能不支持 JSON 模式,换一个 |
| `渲染失败: ...` | PptxGenJS 出错(罕见) | 检查 slideCount 是否在 3–20 |

---

## 四、安全须知

- `.env.local` 已在 `.gitignore` 里,**不会被提交**——切勿把真实 key 写进 `.env.example` 或代码。
- `OPENAI_API_KEY` 只在服务端 route handler 里通过 `process.env` 读取,前端拿不到。
- Vercel 上的环境变量可设为只对 Production 生效,或对所有环境生效,按需勾选。
- key 泄露后**立即在服务商控制台吊销并重新生成**。
