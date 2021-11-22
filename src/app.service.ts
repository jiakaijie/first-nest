import { Injectable } from '@nestjs/common';
import initLogData from './utils/initLogData';
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const puppeteer = require('puppeteer');
const archiver = require("archiver");
const uuid = require('uuid');

@Injectable()
export class AppService {
  showAnswerConfig;
  nodeConfigDir = path.resolve(__dirname, '../nodeConfig');
  logJsonDir = path.resolve(this.nodeConfigDir, 'log.json');
  constructor() {
    this.showAnswerConfig = {
      all: 1,
      hasAnswer: 2,
      noAnswer: 3,
    };
  }
  async getHello(): Promise<string> {
    // await this.generatePdf();
    return 'Hello a!';
  }
  async openBrowser() {
    const browser = await puppeteer.launch();
    return browser;
  }
  async closeBrowser(browser) {
    await browser.close();
  }
  chengeTime(timeStr) {
    // return timeStr.slice(5, 10).replace(/\-/g, '/');
    return timeStr.slice(5, 10);
  }
  async browserPrintPdf(browser, dir, data) {
    const nameConfig = {
      0: '无答案',
      1: '有答案',
    };
    const { user_list, start_time, end_time } = data;
    const { user_name } = user_list[0];
    const newStartTime = this.chengeTime(start_time);
    const newEndTime = this.chengeTime(end_time);
    const pdfName = `${user_name}-${newStartTime}-${newEndTime}-${
      nameConfig[data.isShowAnswer]
    }`;

    const hrefConfig = {
      dev: 'https://localhost:8024/ugc/wrongQuestion',
      test: 'https://dev.ai101test.com/ugc/wrongQuestion',
      pro: 'https://localhost:8024/ugc/wrongQuestion',
    };
    const page = await browser.newPage();
    console.log('新开页面成功');
    await page.goto(`${hrefConfig.test}?data=${JSON.stringify(data)}`, {
      waitUntil: 'networkidle0',
    });
    console.log('网页加载');
    console.log(`${hrefConfig.test}?data=${JSON.stringify(data)}`);
    await page.pdf({ path: `${dir}/${pdfName}.pdf`, format: 'a4' });
    console.log(`生成pdf成功`);
    console.log(`${dir}/${pdfName}.pdf`);
  }
  async sleep(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  }
  async compressedFolder(targetPath, outputZipFilePath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputZipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });
      output.on('close', function () {
        resolve(200);
      });
      output.on('end', function () {
        console.log('Data has been drained');
      });
      archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
        } else {
          throw err;
        }
      });
      archive.on('error', function (err) {
        throw err;
      });
      archive.pipe(output);
      archive.directory(targetPath, '学生错题集');
      archive.finalize();
    });
  }
  async generatePdf(queryData, res) {
    const queryDataData = queryData.data || '{}';

    const dir = path.resolve(os.tmpdir(), uuid.v4() + 'pdf');
    const zipDir = path.resolve(os.tmpdir(), uuid.v4() + 'pdf.zip');

    fs.removeSync(dir);
    fs.mkdirSync(dir);

    console.log(`创建文件夹成功${dir}`);

    const browser = await this.openBrowser();

    console.log('打开浏览器成功');

    const newData = JSON.parse(queryDataData) || {};
    let { user_list = [], show_answer = 1 } = newData;
    user_list = user_list ? user_list : [];
    show_answer = show_answer ? +show_answer : this.showAnswerConfig.all;

    const arr = [0, 1];
    for (let i = 0; i < user_list.length; i++) {
      const data = {
        ...newData,
        user_list: [user_list[i]],
      };
      if (show_answer === this.showAnswerConfig.all) {
        for (let j = 0; j < arr.length; j++) {
          data.isShowAnswer = arr[j];
          await this.browserPrintPdf(browser, dir, data);
        }
      } else if (show_answer === this.showAnswerConfig.hasAnswer) {
        data.isShowAnswer = arr[1];
        await this.browserPrintPdf(browser, dir, data);
      } else {
        data.isShowAnswer = arr[0];
        await this.browserPrintPdf(browser, dir, data);
      }
    }

    console.log('打印完成');
    await this.closeBrowser(browser);
    console.log('关闭浏览器');
    await this.compressedFolder(dir, zipDir);

    console.log('压缩完成');
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-Requested-With',
      'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
      'Content-Disposition': 'attachment;filename=pdfs.zip',
      'Content-type': 'application/octet-stream',
    });
    const fReadStream = fs.createReadStream(zipDir);
    fReadStream.pipe(res);
    // fReadStream.on('data', (chunk) => {
    //   res.write(chunk, 'binary');
    // });
    fReadStream.on('end', () => {
      fs.removeSync(dir);
      fs.removeSync(zipDir);
      console.log('返回pdf完成');
      // res.end();
    });
  }

  getb(): string {
    return 'hello b';
  }

  async getLogConfig(queryData): Promise<any> {
    await this.checkAndWriteJson();
    const logData = fs.readJsonSync(this.logJsonDir);
    const endType = queryData.endType || '';
    if (logData[endType]) {
      return {
        code: 200,
        data: logData[endType],
      };
    } else {
      return {
        code: 400,
        msg: '输入正确的endType类型',
      };
    }
  }
  async checkAndWriteJson() {
    const isDirExists = await this.checkFileIsExists(this.nodeConfigDir);
    if (isDirExists) {
      const isLogJsonDirExists = await this.checkFileIsExists(this.logJsonDir);
      if (isLogJsonDirExists) {
        try {
          fs.readJsonSync(this.logJsonDir);
        } catch {
          this.writeJson(this.logJsonDir, initLogData);
        }
      } else {
        this.writeJson(this.logJsonDir, initLogData);
      }
    } else {
      fs.mkdirSync(this.nodeConfigDir);
      this.writeJson(this.logJsonDir, initLogData);
    }
  }
  writeJson(dir, data) {
    fs.writeJsonSync(dir, data);
  }
  checkFileIsExists(dir) {
    return new Promise((resolve) => {
      fs.exists(dir, (success) => {
        if (success) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
  checkOneOrZero(data) {
    return data === 0 || data === 1;
  }
  async changeLogConfig(bodyData): Promise<any> {
    const { endType, test, production } = bodyData;
    await this.checkAndWriteJson();
    const logData = fs.readJsonSync(this.logJsonDir);
    if (logData.hasOwnProperty(endType)) {
      const endTypeObj = logData[endType];
      endTypeObj.test = this.checkOneOrZero(test) ? test : endTypeObj.test;
      endTypeObj.production = this.checkOneOrZero(production)
        ? production
        : endTypeObj.production;
    }
    await this.writeJson(this.logJsonDir, logData);
    return {
      code: 200,
      msg: 'success',
    };
  }
}
