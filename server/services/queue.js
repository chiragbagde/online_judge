class JobQueue {
    constructor(concurrency = 4, maxSize = 10000) {
      this.queue = [];
      this.running = 0;
      this.concurrency = concurrency;
      this.maxSize = maxSize;
    }
  
    add(job) {
      if (this.queue.length >= this.maxSize) {
        throw new Error("Queue is full");
      }
  
      return new Promise((resolve, reject) => {
        this.queue.push({ job, resolve, reject });
        this.runNext();
      });
    }
  
    async runNext() {
      if (this.running >= this.concurrency || this.queue.length === 0) return;
  
      const { job, resolve, reject } = this.queue.shift();
      this.running++;
  
      try {
        const result = await job();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        this.running--;
        this.runNext();
      }
    }
  }
  

const jobQueue = new JobQueue(8, 10000);
module.exports = jobQueue;