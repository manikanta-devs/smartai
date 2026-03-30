import { app } from "./app";
import { env } from "./config/env";
import { startAutomationScheduler } from "./services/automation.service";

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${env.PORT}`);
  startAutomationScheduler();
});
