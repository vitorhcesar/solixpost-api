import { AppService } from "@/http/services/app/app.service";

export class HttpServerBootstrap {
  start(): void {
    const appService = new AppService();
    appService.start();
  }
}
