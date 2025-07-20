// server.ts (in user-service)

import { app } from "./app.js";

const PORT = process.env.PORT || 4000;
console.log("port", PORT);

app.listen(PORT, () => {
  console.log(`User service Server running on port ${PORT}`);
});
