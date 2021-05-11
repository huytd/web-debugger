const Stream = require('stream');
const exec = require('child_process').exec;

export const rmDir = (dir) => {
  exec(`rm -rf ${dir}`);
};

export const wait = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms));

export const randomRange = (min, max) => {
  return Math.floor(Math.random() * (max - min) ) + min;
};

export const runInDocker = (docker, image, command, options) => new Promise(async (resolve, _) => {
  try {
    let output = {
      stdout: '',
      stderr: ''
    };

    const container = await docker.createContainer({
      'Image': image,
      'Cmd': ["/bin/bash", "-c", command],
      ...options
    });

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      tty: false
    });

    const stdout = new Stream.PassThrough();
    const stderr = new Stream.PassThrough();
    container.modem.demuxStream(stream, stdout, stderr);

    stdout.on('data', (chunk) => {
      output.stdout += chunk.toString('utf-8');
    });

    stderr.on('data', (chunk) => {
      output.stderr += chunk.toString('utf-8');
    });

    await container.start();
    await container.stop();
    await container.remove();
    resolve(output);
  } catch(error) {
    throw error;
  }
});
