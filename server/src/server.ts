import { createApp } from "./app.js";
import { env } from "./config/env.js";

createApp().listen(env.port, () => {
  console.log(`kinlink api listening on http://localhost:${env.port}`);
});
