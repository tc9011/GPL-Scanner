const fs = require('fs');
const path = require('path');

// 解析需要遍历的文件夹
const filePath = path.resolve('./node_modules');

// 存储扫描结果
let results = '';

fs.stat('results.txt', function(err, stat){
  // results.txt文件是否存在
  if(stat&&stat.isFile()) {
    console.log('results.txt存在');
    // 存在则删除
    fs.unlink('results.txt', function (err) {
      if (err) {
        console.log(err);
      }
      console.log('results.txt删除成功');
      fileDisplay(filePath);
    });
  } else {
    console.log('results.txt不存在');
    fileDisplay(filePath);
  }
});

function fileDisplay(filePath) {
  // 根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, (err, files) => {
    if (err) {
      console.warn(err)
    } else {
      // 遍历读取到的文件列表
      files.forEach((filename) => {
        // 获取当前文件的绝对路径
        const filedir = path.join(filePath, filename);
        // 根据文件路径获取文件信息，返回一个fs.Stats对象
        fs.stat(filedir, (eror, stats) => {
          if (eror) {
            console.warn('获取文件stats失败');
          } else {
            const isFile = stats.isFile();// 是文件
            const isDir = stats.isDirectory();// 是文件夹
            if (isFile) {
              checkFiles(filedir);
            }
            if (isDir) {
              fileDisplay(filedir);// 递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
          }
        })
      });
    }
  });
}

function checkFiles(filedir) {
  if (filedir.match(/\bvalidate-npm-package-license\b|\bspdx-license-ids\b|\bspdx-expression-parse\b/)) {   // 排除特殊文件
    return;
  }

  if (filedir.match(/license/i)) {    // 匹配license文件
    console.log('find license in the path：' + filedir);
    readFile(filedir);
  } else if (filedir.match(/package\.json/i)) {   // 匹配package.json文件
    console.log('find package.json in the path：' + filedir);
    readFile(filedir);
  } else if (filedir.match(/readme/i)) {          // 匹配readme文件
    console.log('find readme in the path：' + filedir);
    readFile(filedir);
  }
}

function readFile(filedir) {
  let data = '';
  let isIncludeLicense = false;
  fs.createReadStream(filedir, {encoding: 'utf8'})
    .on('data', (chunk) => {
      if (chunk.match(/license/i)) {
        isIncludeLicense = true;
      }
      if (isIncludeLicense) {   // 只分析出现license后面的文字
        data += chunk;
      }
    })
    .on('end', () => {
      if (data.match(/\bGNU General Public License\b|\bGPL\b|\bLGPL\b/i)) {     // 是否存在GNU|GPL的字段
        console.log('find GPL in ' + filedir);
        writeFile(filedir);
      }
    });
}

function writeFile(filedir) {
  results += `find a package with GPL license  in ${filedir}\n`;
  const ws = fs.createWriteStream('results.txt');
  ws.write(results);
  ws.end();
}