/* Data Compression Using Huffman Coding
   DAA project — vanilla JavaScript implementation
*/

(function () {
  "use strict";

  // ---------- DOM references ----------
  var inputText = document.getElementById("inputText");
  var compressBtn = document.getElementById("compressBtn");
  var sampleBtn = document.getElementById("sampleBtn");
  var clearBtn = document.getElementById("clearBtn");
  var copyBtn = document.getElementById("copyBtn");
  var errorMessage = document.getElementById("errorMessage");
  var results = document.getElementById("results");
  var freqTableBody = document.getElementById("freqTableBody");
  var codeTableBody = document.getElementById("codeTableBody");
  var treeSvg = document.getElementById("huffmanTree");
  var originalTextEl = document.getElementById("originalText");
  var encodedTextEl = document.getElementById("encodedText");
  var decodeEncodedTextEl = document.getElementById("decodeEncodedText");
  var decodedTextEl = document.getElementById("decodedText");
  var verifyMessage = document.getElementById("verifyMessage");
  var copyMessage = document.getElementById("copyMessage");
  var originalBitsEl = document.getElementById("originalBits");
  var encodedBitsEl = document.getElementById("encodedBits");
  var compressionRatioEl = document.getElementById("compressionRatio");
  var spaceSavedEl = document.getElementById("spaceSaved");

  var SAMPLE_TEXT = "ABRACADABRA";
  var lastEncoded = "";

  // Used so equal frequencies still have a stable heap order
  var nodeIdCounter = 0;

  // ---------- Tree node ----------
  // A leaf stores a character. An internal node has char = null and two children.
  function HuffmanNode(ch, freq, left, right) {
    this.ch = ch;
    this.freq = freq;
    this.left = left || null;
    this.right = right || null;
    this.id = nodeIdCounter++;
    this.x = 0;
    this.y = 0;
  }

  HuffmanNode.prototype.isLeaf = function () {
    return this.left === null && this.right === null;
  };

  // ---------- Min-heap (priority queue) ----------
  // Smallest frequency is at the top. Used by the greedy Huffman algorithm.
  function MinHeap() {
    this.data = [];
  }

  MinHeap.prototype.size = function () {
    return this.data.length;
  };

  MinHeap.prototype.push = function (node) {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  };

  MinHeap.prototype.pop = function () {
    if (this.data.length === 0) {
      return null;
    }
    var min = this.data[0];
    var last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return min;
  };

  // Compare by frequency, then by id (older node first) for a consistent tree
  MinHeap.prototype.less = function (a, b) {
    if (a.freq !== b.freq) {
      return a.freq < b.freq;
    }
    return a.id < b.id;
  };

  MinHeap.prototype.bubbleUp = function (index) {
    while (index > 0) {
      var parent = Math.floor((index - 1) / 2);
      if (this.less(this.data[index], this.data[parent])) {
        this.swap(index, parent);
        index = parent;
      } else {
        break;
      }
    }
  };

  MinHeap.prototype.bubbleDown = function (index) {
    var n = this.data.length;
    while (true) {
      var left = 2 * index + 1;
      var right = 2 * index + 2;
      var smallest = index;

      if (left < n && this.less(this.data[left], this.data[smallest])) {
        smallest = left;
      }
      if (right < n && this.less(this.data[right], this.data[smallest])) {
        smallest = right;
      }
      if (smallest === index) {
        break;
      }
      this.swap(index, smallest);
      index = smallest;
    }
  };

  MinHeap.prototype.swap = function (i, j) {
    var tmp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = tmp;
  };

  // ---------- Step 1: count frequencies — O(n) ----------
  function countFrequencies(text) {
    var freq = {};
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (freq[ch] === undefined) {
        freq[ch] = 0;
      }
      freq[ch] += 1;
    }
    return freq;
  }

  // ---------- Step 2: build Huffman tree using min-heap — O(k log k) ----------
  function buildHuffmanTree(freq) {
    var heap = new MinHeap();
    var chars = Object.keys(freq);

    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      heap.push(new HuffmanNode(ch, freq[ch], null, null));
    }

    // Greedy step: always merge the two currently smallest nodes
    while (heap.size() > 1) {
      var left = heap.pop();
      var right = heap.pop();
      var parent = new HuffmanNode(null, left.freq + right.freq, left, right);
      heap.push(parent);
    }

    return heap.pop();
  }

  // ---------- Step 3: assign codes by walking the tree ----------
  function generateCodes(root) {
    var codes = {};

    // Special case: only one distinct character. Prefix code of a single leaf is "0".
    if (root.isLeaf()) {
      codes[root.ch] = "0";
      return codes;
    }

    function walk(node, prefix) {
      if (node.isLeaf()) {
        codes[node.ch] = prefix;
        return;
      }
      // Left child = bit 0, right child = bit 1
      if (node.left) {
        walk(node.left, prefix + "0");
      }
      if (node.right) {
        walk(node.right, prefix + "1");
      }
    }

    walk(root, "");
    return codes;
  }

  // ---------- Step 4: encode the original text — O(n) ----------
  function encodeText(text, codes) {
    var bits = "";
    for (var i = 0; i < text.length; i++) {
      bits += codes[text.charAt(i)];
    }
    return bits;
  }

  // ---------- Step 5: decode by walking the tree (do not reuse original text) ----------
  function decodeText(bits, root) {
    if (!root) {
      return "";
    }

    var decoded = "";

    // Single-character tree: every "0" stands for that one character
    if (root.isLeaf()) {
      for (var i = 0; i < bits.length; i++) {
        if (bits.charAt(i) !== "0") {
          return decoded;
        }
        decoded += root.ch;
      }
      return decoded;
    }

    var node = root;
    for (var j = 0; j < bits.length; j++) {
      var bit = bits.charAt(j);
      if (bit === "0") {
        node = node.left;
      } else {
        node = node.right;
      }

      if (!node) {
        break;
      }

      if (node.isLeaf()) {
        decoded += node.ch;
        node = root;
      }
    }

    return decoded;
  }

  // ---------- Helpers for display ----------
  function displayChar(ch) {
    if (ch === " ") {
      return "[space]";
    }
    if (ch === "\n") {
      return "[newline]";
    }
    if (ch === "\t") {
      return "[tab]";
    }
    if (ch === "\r") {
      return "[carriage return]";
    }
    return ch;
  }

  function sortedChars(freq) {
    return Object.keys(freq).sort(function (a, b) {
      if (freq[b] !== freq[a]) {
        return freq[b] - freq[a];
      }
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }

  function clearChildren(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function addCell(row, text) {
    var td = document.createElement("td");
    td.textContent = text;
    row.appendChild(td);
  }

  function fillFrequencyTable(freq) {
    clearChildren(freqTableBody);
    var chars = sortedChars(freq);
    for (var i = 0; i < chars.length; i++) {
      var tr = document.createElement("tr");
      addCell(tr, displayChar(chars[i]));
      addCell(tr, String(freq[chars[i]]));
      freqTableBody.appendChild(tr);
    }
  }

  function fillCodeTable(freq, codes) {
    clearChildren(codeTableBody);
    var chars = sortedChars(freq);
    for (var i = 0; i < chars.length; i++) {
      var tr = document.createElement("tr");
      addCell(tr, displayChar(chars[i]));
      addCell(tr, String(freq[chars[i]]));
      addCell(tr, codes[chars[i]]);
      codeTableBody.appendChild(tr);
    }
  }

  // ---------- SVG tree drawing ----------
  // Place nodes in inorder so the tree spreads left-to-right.
  function layoutTree(root) {
    var nextX = { value: 0 };
    var maxDepth = 0;

    function visit(node, depth) {
      if (!node) {
        return;
      }
      visit(node.left, depth + 1);
      node.x = nextX.value;
      node.y = depth;
      nextX.value += 1;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      visit(node.right, depth + 1);
    }

    visit(root, 0);
    return { count: nextX.value, maxDepth: maxDepth };
  }

  function drawHuffmanTree(root) {
    while (treeSvg.firstChild) {
      treeSvg.removeChild(treeSvg.firstChild);
    }

    if (!root) {
      return;
    }

    var layout = layoutTree(root);
    var hGap = 90;
    var vGap = 90;
    var marginX = 50;
    var marginY = 40;
    var radius = 26;
    var width = Math.max(320, layout.count * hGap + marginX * 2);
    var height = Math.max(160, (layout.maxDepth + 1) * vGap + marginY * 2);

    treeSvg.setAttribute("width", String(width));
    treeSvg.setAttribute("height", String(height));
    treeSvg.setAttribute("viewBox", "0 0 " + width + " " + height);

    function posX(node) {
      return marginX + node.x * hGap;
    }

    function posY(node) {
      return marginY + node.y * vGap;
    }

    function svgEl(name, attrs) {
      var el = document.createElementNS("http://www.w3.org/2000/svg", name);
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          el.setAttribute(key, attrs[key]);
        }
      }
      return el;
    }

    function drawEdges(node) {
      if (!node) {
        return;
      }
      if (node.left) {
        drawEdge(node, node.left, "0");
        drawEdges(node.left);
      }
      if (node.right) {
        drawEdge(node, node.right, "1");
        drawEdges(node.right);
      }
    }

    function drawEdge(parent, child, label) {
      var x1 = posX(parent);
      var y1 = posY(parent);
      var x2 = posX(child);
      var y2 = posY(child);

      treeSvg.appendChild(
        svgEl("line", {
          x1: String(x1),
          y1: String(y1),
          x2: String(x2),
          y2: String(y2),
          stroke: "#555555",
          "stroke-width": "1.5"
        })
      );

      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2;
      var text = svgEl("text", {
        x: String(mx),
        y: String(my - 4),
        "text-anchor": "middle",
        "font-size": "13",
        "font-family": "Arial, Helvetica, sans-serif",
        fill: "#111111"
      });
      text.textContent = label;
      treeSvg.appendChild(text);
    }

    function drawNodes(node) {
      if (!node) {
        return;
      }

      var cx = posX(node);
      var cy = posY(node);

      treeSvg.appendChild(
        svgEl("circle", {
          cx: String(cx),
          cy: String(cy),
          r: String(radius),
          fill: "#ffffff",
          stroke: "#333333",
          "stroke-width": "1.5"
        })
      );

      if (node.isLeaf()) {
        var charText = svgEl("text", {
          x: String(cx),
          y: String(cy - 5),
          "text-anchor": "middle",
          "font-size": "12",
          "font-family": "Arial, Helvetica, sans-serif",
          fill: "#111111"
        });
        charText.textContent = displayChar(node.ch);
        treeSvg.appendChild(charText);

        var freqText = svgEl("text", {
          x: String(cx),
          y: String(cy + 11),
          "text-anchor": "middle",
          "font-size": "11",
          "font-family": "Arial, Helvetica, sans-serif",
          fill: "#333333"
        });
        freqText.textContent = String(node.freq);
        treeSvg.appendChild(freqText);
      } else {
        var internalText = svgEl("text", {
          x: String(cx),
          y: String(cy + 4),
          "text-anchor": "middle",
          "font-size": "13",
          "font-family": "Arial, Helvetica, sans-serif",
          fill: "#111111"
        });
        internalText.textContent = String(node.freq);
        treeSvg.appendChild(internalText);
      }

      drawNodes(node.left);
      drawNodes(node.right);
    }

    drawEdges(root);
    drawNodes(root);
  }

  // ---------- Statistics (payload only, not a full file format) ----------
  function showStatistics(originalLength, encodedLength) {
    var originalBits = originalLength * 8;
    var encodedBits = encodedLength;

    originalBitsEl.textContent = String(originalBits) + "  (characters × 8)";
    encodedBitsEl.textContent = String(encodedBits);

    if (encodedBits === 0) {
      compressionRatioEl.textContent = "undefined (encoded size is 0)";
      spaceSavedEl.textContent = "undefined";
      return;
    }

    var ratio = originalBits / encodedBits;
    var saved = ((originalBits - encodedBits) / originalBits) * 100;
    compressionRatioEl.textContent = ratio.toFixed(3);
    spaceSavedEl.textContent = saved.toFixed(2) + "%";
  }

  function hideResults() {
    results.hidden = true;
    lastEncoded = "";
  }

  // ---------- Main compress action ----------
  function compressText() {
    var text = inputText.value;
    errorMessage.hidden = true;
    errorMessage.textContent = "";
    copyMessage.hidden = true;

    if (text.length === 0) {
      hideResults();
      errorMessage.textContent = "Please enter some text before compressing. The input box is empty.";
      errorMessage.hidden = false;
      return;
    }

    nodeIdCounter = 0;

    var freq = countFrequencies(text);
    var root = buildHuffmanTree(freq);
    var codes = generateCodes(root);
    var encoded = encodeText(text, codes);
    var decoded = decodeText(encoded, root);

    fillFrequencyTable(freq);
    drawHuffmanTree(root);
    fillCodeTable(freq, codes);

    originalTextEl.textContent = text;
    encodedTextEl.textContent = encoded;
    decodeEncodedTextEl.textContent = encoded;
    decodedTextEl.textContent = decoded;

    lastEncoded = encoded;

    if (decoded === text) {
      verifyMessage.className = "success";
      verifyMessage.textContent = "Verification successful: decoded text matches the original input.";
    } else {
      verifyMessage.className = "mismatch";
      verifyMessage.textContent = "Verification failed: decoded text does not match the original input.";
    }

    showStatistics(text.length, encoded.length);
    results.hidden = false;
  }

  function loadSample() {
    inputText.value = SAMPLE_TEXT;
    errorMessage.hidden = true;
    compressText();
  }

  function clearAll() {
    inputText.value = "";
    errorMessage.hidden = true;
    errorMessage.textContent = "";
    copyMessage.hidden = true;
    hideResults();
  }

  function copyEncoded() {
    if (!lastEncoded) {
      copyMessage.textContent = "Nothing to copy yet. Compress text first.";
      copyMessage.hidden = false;
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastEncoded).then(function () {
        copyMessage.textContent = "Encoded bit string copied to clipboard.";
        copyMessage.hidden = false;
      }).catch(function () {
        fallbackCopy(lastEncoded);
      });
    } else {
      fallbackCopy(lastEncoded);
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      copyMessage.textContent = "Encoded bit string copied to clipboard.";
    } catch (e) {
      copyMessage.textContent = "Copy failed. You can select the encoded text and copy it manually.";
    }
    document.body.removeChild(area);
    copyMessage.hidden = false;
  }

  compressBtn.addEventListener("click", compressText);
  sampleBtn.addEventListener("click", loadSample);
  clearBtn.addEventListener("click", clearAll);
  copyBtn.addEventListener("click", copyEncoded);
})();
