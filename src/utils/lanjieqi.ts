import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

//自定义拦截器必须实现自NestInterceptor，固定写法，该接口只有一个intercept方法
//intercept参数：
//context：请求上下文，可以拿到的Response和Request
@Injectable()
export class AuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        console.log('全局响应拦截器方法返回内容后...');
        return {
          status: 200,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: '请求成功',
          data: data,
        };
      }),
    );
  }
}
