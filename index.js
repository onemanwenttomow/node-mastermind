// inspired by https://blog.bitsrc.io/build-a-select-options-for-the-terminal-using-nodejs-e2d699cc85fe

const rdl = require("readline");
const l = console.log;
const stdout = process.stdout;
const stdin = process.stdin;

function random(num) {
  return Math.floor(Math.random() * num);
}

function select({ question, answers, options, pointer, cursorColor }) {
  const computer = [
    answers[random(options.length)],
    answers[random(options.length)],
    answers[random(options.length)],
    answers[random(options.length)]
  ];
  let input;
  let cursorLocs = {
    x: 0,
    y: 0
  };
  let selectedColours = [];
  let results = [];
  let currentGuess = 0;

  function start() {
    stdout.write(question + "\n");
    for (let opt = 0; opt < options.length; opt++) {
      options[opt] = pointer + " " + options[opt];
      if (opt === options.length - 1) {
        input = options.length - 1;
        options[opt] += "\n";
        stdout.write(color(options[opt], cursorColor));
      } else {
        options[opt] += "\n";
        stdout.write(options[opt]);
      }
      cursorLocs.y = opt + 1;
    }
    stdout.write("\n");
    stdout.write("\n");
    stdout.write("[ _ _ _ _ ]");
    stdout.write("\n");
    stdout.write("\n");
    const guessRow = "  _ _ _ _  \n";
    for (let i = 0; i < 12; i++) {
      stdout.write(guessRow);
    }
    // console.log(computer);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf-8");
    hideCursor();
    stdin.on("data", pn());
  }

  function hideCursor() {
    stdout.write("\x1B[?25l");
  }

  function showCursor() {
    stdout.write("\x1B[?25h");
  }

  function color(str, colorName = "yellow") {
    const colors = {
      yellow: [33, 89],
      blue: [34, 89],
      green: [32, 89],
      cyan: [35, 89],
      red: [31, 89],
      magenta: [36, 89]
    };
    const _color = colors[colorName];
    const start = "\x1b[" + _color[0] + "m";
    const stop = "\x1b[" + _color[1] + "m\x1b[0m";
    return start + str + stop;
  }

  function pn() {
    return (c) => {
      switch (c) {
        case "\u0004": // Ctrl-d
        case "\r":
        case "\n":
          return enter();
        case "\u0003": // Ctrl-c
          return ctrlc();
        case "\u001b[A":
          return upArrow();
        case "\u001b[B":
          return downArrow();
        case "\u001B\u005B\u0041": // up
          return upArrow();
        case "\u001B\u005B\u0042": // right
          return upArrow();
        case "\u001B\u005B\u0043": // down
          return downArrow();
        case "\u001B\u005B\u0044": // left
          return downArrow();
      }
    };
  }

  function enter() {
    // TODO check for defeat (i.e. did not guess in certain number of turns)

    // add the next row of guesses
    if (!selectedColours[currentGuess]) {
      selectedColours.push([]);
    }

    // if row is full then move to next row
    if (selectedColours[currentGuess].length >= 4) {
      currentGuess++;
      return enter();
    }

    // move cursor to correct line
    rdl.cursorTo(stdout, 0, options.length + 5);

    // add answer to correct sub array
    selectedColours[currentGuess].push(answers[input]);

    const { correct } = checkBoard();

    // generate output to be printed to the screen
    let output = "";
    for (let i = 0; i < selectedColours.length; i++) {
      const o = results[i] || "";
      output += " " + selectedColours[i].join("") + "\t" + o + "\n";
    }

    l(output);

    if (correct === 4) {
      // TODO check for victory
      rdl.cursorTo(stdout, 0, options.length + 19);
      return l("  🎉🎉🎉 CONGRATS 🎉🎉🎉");
    }

    // use this to exit the game later...
    // stdin.removeListener("data", pn);
    // stdin.setRawMode(false);
    // stdin.pause();
    // showCursor();
  }

  function checkBoard() {
    let result = "";
    let correct = 0;
    if (selectedColours[currentGuess].length >= 4) {
      let g = selectedColours[currentGuess].slice();
      let c = computer.slice();
      for (let i = 0; i < computer.length; i++) {
        if (computer[i] === selectedColours[currentGuess][i]) {
          result += color(".", "red");
          correct++;
          g[i] = "*";
          c[i] = "";
        }
      }
      for (let i = 0; i < computer.length; i++) {
        if (c.includes(g[i])) {
          result += ".";
        }
      }

      results.push(result);
    }
    return { correct };
  }

  function ctrlc() {
    stdin.removeListener("data", pn);
    stdin.setRawMode(false);
    stdin.pause();
    showCursor();
  }

  function upArrow() {
    let y = cursorLocs.y;
    rdl.cursorTo(stdout, 0, y);
    stdout.write(options[y - 1]);
    if (cursorLocs.y === 1) {
      cursorLocs.y = options.length;
    } else {
      cursorLocs.y--;
    }
    y = cursorLocs.y;
    rdl.cursorTo(stdout, 0, y);
    stdout.write(color(options[y - 1], cursorColor));
    input = y - 1;
  }

  function downArrow() {
    let y = cursorLocs.y;
    rdl.cursorTo(stdout, 0, y);
    stdout.write(options[y - 1]);
    if (cursorLocs.y === options.length) {
      cursorLocs.y = 1;
    } else {
      cursorLocs.y++;
    }
    y = cursorLocs.y;
    rdl.cursorTo(stdout, 0, y);
    stdout.write(color(options[y - 1], cursorColor));
    input = y - 1;
  }

  return { hideCursor, showCursor, start };
}

const s = select({
  question: "Pick a colour",
  options: ["[🔴]", "[🟡]", "[🔵]", "[🟢]", "[⚪]", "[⚫]"],
  answers: ["🔴", "🟡", "🔵", "🟢", "⚪", "⚫"],
  pointer: "",
  cursorColor: "red"
});

console.clear();
s.start();
