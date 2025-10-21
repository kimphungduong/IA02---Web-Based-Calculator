(function(){
  'use strict';

  const historyEl = document.getElementById('history');
  const currentEl = document.getElementById('current');
  const keypad = document.querySelector('.keypad');

  // Calculator state
  let expression = []; // tokens: numbers as strings, operators + - × ÷ √ %
  let current = '0';
  let lastPressed = null; // 'num' | 'op' | 'eq' | 'fn'

  function updateDisplay() {
    // Nếu kết quả vừa được tính (lastPressed === 'eq'), historyEl sẽ giữ lại phép tính cuối.
    // Ngược lại, nó sẽ hiển thị expression đang xây dựng.
    if (lastPressed !== 'eq') {
      historyEl.textContent = expression.join(' ');
    }
    currentEl.textContent = current;
  }

  function formatNumber(n) {
    // Reduce floating point noise; cap to 12 significant digits
    if (!isFinite(n)) return 'Error';
    let s = Number(n).toPrecision(12);
    // Trim trailing zeros and decimal
    s = s.replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
    // Remove leading + sign
    if (s.startsWith('+')) s = s.slice(1);
    return s;
  }

  function inputDigit(d) {
    if (lastPressed === 'eq') {
      // start new calc
      expression = [];
      current = '0';
    }
    if (d === '.') {
      if (!current.includes('.')) current += '.';
    } else {
      if (current === '0') current = d;
      else current += d;
    }
    lastPressed = 'num';
    updateDisplay();
  }

  function setOperator(op) {
    if (lastPressed === 'op' || lastPressed === 'fn') {
      // Replace last operator/function
      if (expression.length > 0) {
        // Only replace if the last token is a standard operator (+, -, *, /)
        if (['+', '−', '×', '÷'].includes(expression[expression.length-1])) {
          expression[expression.length-1] = op;
        } else {
          // If the last token is √ or %, it means we've just completed a number.
          // The current number is the new operand for the new operator.
          if (current !== '0') expression.push(current);
          expression.push(op);
          current = '0';
        }
      }
    } else {
      // Push current number first
      if (lastPressed !== 'eq') {
        expression.push(current);
      } else {
        // use current result as starting operand
        expression = [current];
      }
      expression.push(op);
      // prepare for next number
      current = '0';
    }
    lastPressed = 'op';
    updateDisplay();
  }

  function clearAll() {
    expression = [];
    current = '0';
    lastPressed = null;
    updateDisplay();
  }

  function clearEntry() {
    current = '0';
    updateDisplay();
  }

  function backspace() {
    if (lastPressed === 'eq') return;
    if (current.length > 1) current = current.slice(0, -1);
    else current = '0';
    updateDisplay();
  }

  function negate() {
    if (current === '0') return;
    if (current.startsWith('-')) current = current.slice(1);
    else current = '-' + current;
    lastPressed = 'fn';
    updateDisplay();
  }

  // Chỉnh sửa √: Bấm √ trước, sau đó bấm số, và bấm = để tính (Giống như toán tử tiền tố)
  function sqrt() {
    if (lastPressed === 'eq') {
      expression = [];
      current = '0';
    }
    
    // Nếu đang có số, đẩy số đó vào expression trước khi thêm √
    if (lastPressed === 'num' || lastPressed === 'eq') {
      expression.push(current);
    }
    
    // Thêm toán tử √ vào expression
    expression.push('√');
    current = '0';
    lastPressed = 'fn'; // fn = function/operator
    updateDisplay();
  }

  // Chỉnh sửa %: Bấm số, bấm %, bấm = để tính (Ví dụ: 9% = 0.09)
  function percent() {
    if (lastPressed === 'eq') {
      // Use result as operand for percent
      expression = [current];
    }
    
    // Chỉ thêm % nếu trước đó là số (num) hoặc kết quả (eq)
    if (lastPressed === 'num' || lastPressed === 'eq') {
      expression.push(current, '%');
      current = '0';
    }
    
    // Bỏ qua nếu trước đó là toán tử
    lastPressed = 'fn';
    updateDisplay();
  }

  // Hàm đánh giá biểu thức (Đã sửa để xử lý √ và %)
  function sanitizeAndEval(exprTokens) {
    let finalTokens = [];
    
    // Bước 1: Xử lý các toán tử đơn (√, %)
    for (let i = 0; i < exprTokens.length; i++) {
        const token = exprTokens[i];
        
        if (token === '√') {
            // Toán tử √ (Tiền tố/Prefix): √ X
            // Do logic hiện tại, nó sẽ xử lý cặp (√, X)
            const nextToken = exprTokens[i + 1];
            const num = parseFloat(nextToken);

            if (num < 0) return NaN;
            
            // Xử lý trường hợp chỉ có √ trong expression
            if (isNaN(num)) {
                // Ví dụ: chỉ bấm √ và =
                return NaN; // Trả về 0 hoặc lỗi, tùy logic mong muốn
            }
            
            finalTokens.push(Math.sqrt(num));
            i++; // Bỏ qua token số sau √
        } else if (token === '%') {
            const lastNum = parseFloat(finalTokens.pop());
            const prevOp = finalTokens[finalTokens.length - 1];
            const prevNum = parseFloat(finalTokens[finalTokens.length - 2]);
            let val = lastNum / 100;
            if (['+', '−'].includes(prevOp)) val = prevNum * (lastNum / 100);
            finalTokens.push(val);
          } else {
            finalTokens.push(token);
        }
    }

    // Bước 2: Chuyển đổi sang toán tử JS và đánh giá
    const src = finalTokens.join(' ')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');
      
    // Kiểm tra ký tự không hợp lệ
    if (!/^[\d+\-*\/.\s]+$/.test(src)) return NaN;
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('return (' + src + ')')();
      return result;
    } catch (e) {
      return NaN;
    }
  }

  function equals() {
    let tokens = expression.slice();
    let historyString = '';

    // Nếu lần nhấn cuối không phải là toán tử, thêm số hiện tại vào biểu thức
    if (lastPressed !== 'op' && lastPressed !== 'fn') {
      tokens.push(current);
    }
    
    if (tokens.length === 0) return;

    // Lưu lại chuỗi phép tính đầy đủ trước khi tính
    historyString = tokens.join(' ') + ' =';

    const res = sanitizeAndEval(tokens);
    const formatted = formatNumber(res);

    current = formatted;
    
    // Hiển thị phép tính đầy đủ (ví dụ: 2 + 3 =) ở historyEl
    historyEl.textContent = historyString; 
    
    // Xóa expression để chuẩn bị cho phép tính mới, nhưng giữ lại lịch sử hiển thị
    expression = []; 
    lastPressed = 'eq';
    updateDisplay(); // updateDisplay không còn ghi đè historyEl khi lastPressed='eq'
  }

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      const d = btn.dataset.num;
      if (d === '.' && current.includes('.')) return inputDigit('.');
      if (d === '.' && lastPressed === 'eq') { expression = []; current='0'; }
      inputDigit(d);
    } else if (btn.dataset.op) {
      setOperator(btn.dataset.op);
    } else if (btn.dataset.action) {
      const act = btn.dataset.action;
      if (act === 'ce') clearEntry();
      if (act === 'c') clearAll();
      if (act === 'back') backspace();
      if (act === 'eq') equals();
      if (act === 'sqrt') sqrt();
      if (act === 'percent') percent();
      if (act === 'negate') negate();
    }
  });

  // Keyboard support (Không thay đổi)
  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if ((k >= '0' && k <= '9') || k === '.') return inputDigit(k);
    if (k === '+' || k === '-' || k === '*' || k === '/') {
      const map = { '+': '+', '-': '−', '*': '×', '/': '÷' };
      return setOperator(map[k]);
    }
    if (k === 'Enter' || k === '=') return equals();
    if (k === 'Backspace') return backspace();
    if (k === 'Escape') return clearAll();
    if (k === 'Delete') return clearEntry();
    if (k.toLowerCase() === 'r') return sqrt();
    if (k === '%') return percent();
    if (k.toLowerCase() === 'n') return negate();
  });

  updateDisplay();
})();