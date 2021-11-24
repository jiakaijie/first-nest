import { Controller, Get, Post, Res, Query, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/c')
  getHello1(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('/a')
  getHello(@Query() queryData, @Res() res) {
    return this.appService.generatePdf(queryData, res);
  }

  @Get('/b')
  getB(): string {
    console.log('bbb');
    return this.appService.getb();
  }

  @Get('/getLogConfig')
  getLogConfig(@Query() queryData): Promise<any> {
    return this.appService.getLogConfig(queryData);
  }
  @Post('/changeLogConfig')
  getC(@Body() bodyData) {
    return this.appService.changeLogConfig(bodyData);
  }
}
