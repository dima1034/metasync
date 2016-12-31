'use strict';

const metasync = require('./metasync');
const fs = require('fs');
const assert = require('assert');
const ASYNC_TIMEOUT = 200;

// assert.deepStrictEqual polyfill for pre-io.js
if (!assert.deepStrictEqual) {
  assert.deepStrictEqual = (actual, expected, message) => {
    let actualKeys = Object.keys(actual);
    let expectedKeys = Object.keys(expected);
    assert.strictEqual(actualKeys.length, expectedKeys.length, message);
    for (let i = 0; i < actualKeys.length; i++) {
      let key = actualKeys[i];
      assert.strictEqual(actual[key], expected[key], message);
    }
  };
}

// Functional Asyncronous Composition

function compositionTest(end) {

  metasync.composition(
    [f1, f2, f3, [[f4, f5, [f6, f7], f8]], [[f9, f10]], f11],
    (data) => console.dir(data)
  );

  function f1(callback) {
    console.log('f1');
    setTimeout(() => callback('result1'), ASYNC_TIMEOUT);
  }

  function f2(data, callback) {
    console.log('f2');
    setTimeout(() => callback('result2'), ASYNC_TIMEOUT);
  }

  function f3(data, callback) {
    console.log('f3');
    setTimeout(() => {
      data.third = 'result3';
      callback();
    }, ASYNC_TIMEOUT);
  }

  function f4(callback) {
    console.log('f4');
    setTimeout(() => callback(), ASYNC_TIMEOUT);
  }

  function f5(data, callback) {
    console.log('f5');
    setTimeout(() => callback(5), ASYNC_TIMEOUT);
  }

  function f6(data, callback) {
    console.log('f6');
    setTimeout(() => callback('result6'), ASYNC_TIMEOUT);
  }

  function f7(data, callback) {
    console.log('f7');
    setTimeout(() => callback('result7'), ASYNC_TIMEOUT);
  }

  function f8(data, callback) {
    console.log('f8');
    setTimeout(() => callback('result8'), ASYNC_TIMEOUT);
  }

  function f9(data, callback) {
    console.log('f9');
    setTimeout(() => callback('result9'), ASYNC_TIMEOUT);
  }

  function f10(data, callback) {
    console.log('f10');
    setTimeout(() => callback('result10'), ASYNC_TIMEOUT);
  }

  function f11(data, callback) {
    console.log('f11');
    setTimeout(() => {
      callback('result11');
      console.log('Composition test done');
      end();
    }, ASYNC_TIMEOUT);
  }

}

// Data Collector

function dataCollectorTest(end) {

  let dataCollector = new metasync.DataCollector(4);

  dataCollector.on('done', (errs, data) => {
    console.dir({
      dataKeys: Object.keys(data)
    });
    console.log('DataCollector test done');
    end();
  });

  dataCollector.collect('user', { name: 'Marcus Aurelius' });

  fs.readFile('HISTORY.md', (err, data) => {
    dataCollector.collect('history', data);
  });

  fs.readFile('README.md', (err, data) => {
    dataCollector.collect('readme', data);
  });

  setTimeout(() => {
    dataCollector.collect('timer', { date: new Date() });
  }, ASYNC_TIMEOUT);

}

function dataCollectorTimeoutTest(end) {

  let dataCollector = new metasync.DataCollector(4, 1000);

  dataCollector.on('timeout', (err, data) => {
    console.dir({
      err: err ? err.toString() : null,
      dataKeys: Object.keys(data)
    });
    console.log('Collector timeout test done');
    end();
  });

  dataCollector.collect('user', { name: 'Marcus Aurelius' });

}

function dataCollectorErrorTest(end) {

  let dataCollector = new metasync.DataCollector(4);

  dataCollector.on('error', (err, key) => {
    console.dir({
      err: err ? err.toString() : null,
      key: key
    });
  });

  dataCollector.on('done', (errs, data) => {
    console.dir({
      errorKeys: errs ? Object.keys(errs) : null,
      dataKeys: Object.keys(data)
    });
    console.log('Collector Error test done');
    end();
  });

  dataCollector.collect('user', new Error('User not found'));
  dataCollector.collect('file', 'file content');
  dataCollector.collect('score', 1000);
  dataCollector.collect('tcp', new Error('No socket'));

}

// Key Collector

function keyCollectorTest(end) {

  let keyCollector = new metasync.KeyCollector(['user', 'history'], 1000);

  keyCollector.on('done', (errs, data) => {
    console.dir({
      dataKeys: Object.keys(data)
    });
    console.log('KeyCollector test done');
    end();
  });

  keyCollector.collect('user', { name: 'Marcus Aurelius' });

  fs.readFile('HISTORY.md', (err, data) => {
    keyCollector.collect('history', data);
  });

}
// Parallel execution

function parallelTest(end) {

  metasync.parallel([pf1, pf2, pf3], () => {
    console.log('Parallel test done');
    end();
  });

  function pf1(data, callback) {
    console.log('pf1');
    setTimeout(() => callback('result1'), ASYNC_TIMEOUT);
  }

  function pf2(data, callback) {
    console.log('pf2');
    setTimeout(() => callback('result2'), ASYNC_TIMEOUT);
  }

  function pf3(data, callback) {
    console.log('pf3');
    setTimeout(() => callback('result3'), ASYNC_TIMEOUT);
  }

}

// Sequential execution

function sequentialTest(end) {

  metasync.sequential([sf1, sf2, sf3], () => {
    console.log('Sequential test done');
    end();
  });

  function sf1(data, callback) {
    console.log('sf1');
    setTimeout(() => callback('result1'), ASYNC_TIMEOUT);
  }

  function sf2(data, callback) {
    console.log('sf2');
    setTimeout(() => callback('result2'), ASYNC_TIMEOUT);
  }

  function sf3(data, callback) {
    console.log('sf3');
    setTimeout(() => callback('result3'), ASYNC_TIMEOUT);
  }

}

// Asynchrous filter

function filterTest(end) {

  let dataToFilter = [
    'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
    'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
    'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua',
  ];

  function filterPredicate(item, callback) {
    // filter words which consists of unique letters only
    let letters = [];
    console.log('checking value: ' + item);
    for (let i = 0; i < item.length; ++i) {
      if (letters.indexOf(item[i].toLowerCase()) > -1) {
        break;
      }
      letters.push(item[i].toLowerCase());
    }

    setTimeout(() => callback(letters.length === item.length), ASYNC_TIMEOUT);
  }

  metasync.filter(dataToFilter, filterPredicate, (result) => {
    console.log('filtered array: ' + result);
    console.log('Filter test done');
    end();
  });

}

// Asynchrous find

function findTest(end) {

  metasync.find(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    (item, callback) => (
      callback(item % 3 === 0 && item % 5 === 0)
    ),
    (result) => {
      console.log('found value: ' + result);
      console.log('Find test done');
      end();
    }
  );

}

// Asyncronous each in parallel

function eachTest(end) {

  metasync.each(
    ['a', 'b', 'c'],
    (item, callback) => {
      console.dir({ each: item });
      callback();
    },
    (/*data*/) => {
      console.log('Each test done');
      end();
    }
  );

}

// Asyncronous series (sequential)

function seriesTest(end) {

  metasync.series(
    ['a', 'b', 'c'],
    (item, callback) => {
      console.dir({ series: item });
      callback();
    },
    (/*data*/) => {
      console.log('Series test done');
      end();
    }
  );

}

// Asyncronous reduce (sequential)

function reduceTest(end) {

  metasync.reduce(
    ['a', 'b', 'c'],
    (prev, curr, callback) => {
      console.dir({ reduce: { prev: prev, curr: curr } });
      callback(null, curr);
    },
    (/*err, data*/) => {
      console.log('Reduce test done');
      end();
    }
  );

}

function concurrentQueueTest(end) {

  let queue =  new metasync.ConcurrentQueue(3, 2000);

  queue.on('process', (item, callback) => {
    setTimeout(() => {
      console.dir({ item: item });
      callback();
    }, 100);
  });

  queue.on('timeout', () => {
    console.log('ConcurrentQueue timed out');
  });

  queue.on('empty', () => {
    console.log('ConcurrentQueue test done');
    end();
  });

  queue.add({ id: 1 });
  queue.add({ id: 2 });
  queue.add({ id: 3 });
  queue.add({ id: 4 });
  queue.add({ id: 5 });
  queue.add({ id: 6 });
  queue.add({ id: 8 });
  queue.add({ id: 9 });
}

function concurrentQueuePauseResumeStopTest(end) {
  let queue =  new metasync.ConcurrentQueue(3, 2000);
  queue.pause();
  queue.on('empty', end);
  if (!queue.events.empty) {
    console.log('ConcurrentQueue pause test done');
  }
  queue.resume();
  queue.on('empty', end);
  if (queue.events.empty) {
    console.log('ConcurrentQueue resume test done');
  }
  queue.stop();
  if (queue.count === 0) {
    console.log('ConcurrentQueue stop test done');
  }
}

function throttleTest(end) {

  let state;

  function fn(letter) {
    console.log('Throttled function, state: ' + state);
    if (state === letter) {
      console.log('Throttle test done');
      end();
    }
  }

  let f1 = metasync.throttle(500, fn, ['I']);

  // to be called 2 times (first and last: A and E)
  state = 'A';
  f1();
  state = 'B';
  f1();
  state = 'C';
  f1();
  state = 'D';
  f1();
  state = 'E';
  f1();

  // to be called 2 times (last will be I)
  setTimeout(() => {
    state = 'F';
    f1();
  }, 600);
  setTimeout(() => {
    state = 'G';
    f1();
  }, 700);
  setTimeout(() => {
    state = 'H';
    f1();
  }, 1000);
  setTimeout(() => {
    state = 'I';
    f1();
  }, 1100);

}

function mapTest() {
  metasync.map([1, 2, 3], (item, callback) => {
    setTimeout(() => {
      callback(null, item * item);
    }, item * 10);
  }, (error, result) => {
    assert.ifError(error);
    assert.deepStrictEqual(result, [1, 4, 9]);
    console.log('Map test #1 done');
  });

  metasync.map([1, 2, 3], (item, callback) => {
    setTimeout(() => {
      if (item === 2) {
        callback(new Error());
      } else {
        callback(null, item);
      }
    }, item * 10);
  }, (error, result) => {
    assert.ok(error);
    assert.ifError(result);
    console.log('Map test #2 done');
  });
}

function timeoutTest() {
  // Done function called by timer
  let start1 = new Date();
  metasync.timeout(200, (done) => {
    setTimeout(done, 300);
  }, () => {
    let timeDiff = new Date() - start1;
    assert(timeDiff < 250);
    console.log('Timout test #1 done');
  });

  // Done function called by async function
  let start2 = new Date();
  metasync.timeout(300, done => setTimeout(done, 200), () => {
    let timeDiff = new Date() - start2;
    assert(timeDiff < 250);
    console.log('Timout test #2 done');
  });
}

// Run tests

metasync.composition([
  compositionTest,
  dataCollectorTest,
  dataCollectorTimeoutTest,
  dataCollectorErrorTest,
  keyCollectorTest,
  parallelTest,
  sequentialTest,
  filterTest,
  findTest,
  eachTest,
  seriesTest,
  reduceTest,
  concurrentQueueTest,
  concurrentQueuePauseResumeStopTest,
  throttleTest,
  mapTest,
  timeoutTest
], () => {
  console.log('All tests done');
});
