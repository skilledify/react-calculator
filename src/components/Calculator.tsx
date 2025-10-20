import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Special buttons
const specialButtons = ["√", "x²", "1/x"];

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState("0");
  const [first, setFirst] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const displayRef = useRef<HTMLDivElement>(null); // Для доступа к DOM-элементу дисплея

 const MAX_DISPLAY_LENGTH = 16; // Максимальная длина отображаемого числа

  // Функция для форматирования числа
  const formatNumber = useCallback((num: number | string): string => {
    const numStr = String(num);
    if (numStr === "NaN") return "Ошибка";

    // Проверяем, есть ли десятичная точка
    if (numStr.includes(".")) {
      const [integerPart, decimalPart] = numStr.split(".");
      // Ограничиваем количество знаков после запятой
      if (decimalPart.length > MAX_DISPLAY_LENGTH - integerPart.length - 1) {
        return parseFloat(numStr).toFixed(
          MAX_DISPLAY_LENGTH - integerPart.length - 1
        );
      }
    }

    // Если нет десятичной точки, просто ограничиваем длину
    if (numStr.length > MAX_DISPLAY_LENGTH) {
      return parseFloat(numStr).toExponential(MAX_DISPLAY_LENGTH - 6); // Применяем научную нотацию
    }

    return numStr;
  }, [MAX_DISPLAY_LENGTH]);

  const calculate = useCallback((a: string, b: string, op: string): string => {
    const x = parseFloat(a);
    const y = parseFloat(b);
    switch (op) {
      case "+":
        return formatNumber(x + y);
      case "-":
        return formatNumber(x - y);
      case "×":
        return formatNumber(x * y);
      case "÷":
        if (y === 0) return "Ошибка: деление на ноль";
        return formatNumber(x / y);
      default:
        return b;
    }
  }, [formatNumber]);

  const calculateSpecial = useCallback((op: string, value: string): string => {
    const num = parseFloat(value);
    switch (op) {
      case "√":
        if (num < 0) return "Ошибка: корень из отрицательного числа";
        return formatNumber(Math.sqrt(num));
      case "x²":
        return formatNumber(num * num);
      case "1/x":
        if (num === 0) return "Ошибка: деление на ноль";
        return formatNumber(1 / num);
      default:
        return value;
    }
  }, [formatNumber]);

  const handleDigitClick = useCallback((digit: string) => {
    setDisplay((prev) => {
      if (waiting) {
        setWaiting(false);
        return digit === "." ? "0." : digit;
      }

      if (prev === "0" && digit !== ".") {
        return digit;
      }

      if (prev.includes(".") && digit === ".") {
        return prev; // Нельзя вводить вторую точку
      }

      const newDisplay = prev + digit;
      return newDisplay.length > MAX_DISPLAY_LENGTH ? prev : newDisplay;
    });
  }, [waiting, MAX_DISPLAY_LENGTH]);

  const handleClick = useCallback((val: string) => {
    if (/^[0-9.]$/.test(val)) {
      handleDigitClick(val);
      return;
    }
switch (val) {
  case "C":
    setDisplay("0");
    setFirst(null);
    setOperator(null);
    setWaiting(false);
    break;
  case "DEL":
    setDisplay((prev) => {
      if (prev.length === 1 || (prev.length === 2 && prev.startsWith("-"))) {
        return "0";
      }
      return prev.slice(0, -1);
    });
    break;
  case "±":
    setDisplay((prev) => {
      const num = parseFloat(prev);
      return formatNumber(-num);
    });
    break;
  case "%":
    setDisplay((prev) => {
      const num = parseFloat(prev);
      return formatNumber(num / 10);
    });
    break;
  case "÷":
  case "×":
  case "-":
  case "+":
    if (first === null) setFirst(display);
    else if (operator) {
      const result = calculate(first, display, operator);
      setDisplay(result);
      setFirst(result); // Используем результат для следующего вычисления
    }
    setOperator(val);
    setWaiting(true);
    break;
  case "=":
    if (operator && first !== null) {
      const result = calculate(first, display, operator);
      setDisplay(result);
      setHistory((prev) => [
        `${first} ${operator} ${display} = ${result}`,
        ...prev.slice(0, 4),
      ]);
      setFirst(null);
      setOperator(null);
    }
    break;
  case "√":
  case "x²":
  case "1/x": {
    const resultSpecial = calculateSpecial(val, display);
    setDisplay(resultSpecial);
    setHistory((prev) => [
      `${val}(${display}) = ${resultSpecial}`,
      ...prev.slice(0, 4),
    ]);
    break;
  }
}

  }, [display, first, operator, calculate, calculateSpecial, formatNumber, handleDigitClick]);

  // Добавляем обработку нажатий клавиш клавиатуры
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (/[0-9.]/.test(key)) {
        handleClick(key);
      } else if (key === "+" || key === "-" || key === "*" || key === "/") {
        const operatorMap: { [key: string]: string } = {
          "*": "×",
          "/": "÷",
        };
        handleClick(operatorMap[key] || key);
      } else if (key === "Enter") {
        handleClick("=");
      } else if (key === "Backspace") {
        handleClick("C"); // Или другая логика для Backspace
      } else if (key === "Escape") {
        handleClick("C");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClick]);

  useEffect(() => {
    // Автоматический скроллинг истории
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
 }, [display]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <div className="w-full max-w-[90vw] sm:max-w-sm mx-auto px-4 py-5 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-2xl border border-gray-300 dark:border-gray-700 transition-all duration-500">
        <h2 className="text-lg font-semibold mb-4">React-Calculator</h2>

        {/* === Дисплей === */}
        <div
          ref={displayRef}
          className="text-right text-3xl sm:text-4xl font-light p-4 mb-2 bg-gray-100 dark:bg-gray-800 rounded-2xl h-20 flex items-end justify-end overflow-x-auto"
        >
          {display}
        </div>

        {/* === История === */}
        {history.length > 0 && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-sm max-h-24 overflow-y-auto border-gray-200 dark:border-gray-700">
            {history.map((item, i) => (
              <div
                key={i}
                className="text-gray-600 dark:text-gray-400 text-right"
              >
                {item}
              </div>
            ))}
          </div>
        )}
{/* === Кнопки === */}
<div className="grid grid-cols-4 gap-3">
  {/* First row: C, ±, %, empty slot */}
  <motion.button
    key="C"
    onClick={() => handleClick("C")}
    whileTap={{ scale: 0.9 }}
    className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-red-500 hover:bg-red-400 text-white"
  >
    C
  </motion.button>
  <motion.button
    key="±"
    onClick={() => handleClick("±")}
    whileTap={{ scale: 0.9 }}
    className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-blue-500 hover:bg-blue-400 text-white"
  >
    ±
  </motion.button>
  <motion.button
    key="%"
    onClick={() => handleClick("%")}
    whileTap={{ scale: 0.9 }}
    className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-blue-500 hover:bg-blue-400 text-white"
 >
    %
  </motion.button>
  <div className="invisible">
    {/* Empty slot where DEL button was */}
  </div>
{/* Second row: Special buttons √, x², 1/x, ÷ - placing special buttons above 7,8,9 as requested */}
{specialButtons.map((btn) => (
  <motion.button
    key={btn}
    onClick={() => handleClick(btn)}
    whileTap={{ scale: 0.9 }}
    className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-purple-500 hover:bg-purple-400 text-white"
  >
    {btn}
  </motion.button>
))}
<motion.button
  key="÷"
  onClick={() => handleClick("÷")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-orange-500 hover:bg-orange-400 text-white"
>
  ÷
</motion.button>

{/* Third row: 7, 8, 9, × */}
<motion.button
  key="7"
  onClick={() => handleClick("7")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  7
</motion.button>
<motion.button
  key="8"
  onClick={() => handleClick("8")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  8
</motion.button>
<motion.button
  key="9"
  onClick={() => handleClick("9")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  9
</motion.button>
<motion.button
  key="×"
  onClick={() => handleClick("×")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-orange-500 hover:bg-orange-400 text-white"
>
  ×
</motion.button>

{/* Fourth row: 4, 5, 6, - */}
<motion.button
  key="4"
  onClick={() => handleClick("4")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  4
</motion.button>
<motion.button
  key="5"
  onClick={() => handleClick("5")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  5
</motion.button>
<motion.button
  key="6"
  onClick={() => handleClick("6")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  6
</motion.button>
<motion.button
  key="-"
  onClick={() => handleClick("-")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-orange-500 hover:bg-orange-400 text-white"
>
  -
</motion.button>

{/* Fifth row: 1, 2, 3, + */}
<motion.button
  key="1"
  onClick={() => handleClick("1")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  1
</motion.button>
<motion.button
  key="2"
  onClick={() => handleClick("2")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  2
</motion.button>
<motion.button
  key="3"
  onClick={() => handleClick("3")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
>
  3
</motion.button>
<motion.button
  key="+"
  onClick={() => handleClick("+")}
  whileTap={{ scale: 0.9 }}
  className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-orange-500 hover:bg-orange-400 text-white"
>
  +
</motion.button>

{/* Sixth row: 0 (span 2 cols), . (span 2 cols), = */}
 <motion.button
   key="0"
   onClick={() => handleClick("0")}
   whileTap={{ scale: 0.9 }}
   className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 col-span-2"
 >
   0
 </motion.button>
 <motion.button
   key="."
   onClick={() => handleClick(".")}
   whileTap={{ scale: 0.9 }}
   className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
 >
   .
 </motion.button>
 <motion.button
   key="="
   onClick={() => handleClick("=")}
   whileTap={{ scale: 0.9 }}
   className="rounded-2xl py-4 text-lg sm:text-xl font-medium transition-colors duration-150 bg-green-500 hover:bg-green-40 text-white col-span-2"
 >
   =
 </motion.button>

</div>

      </div>
    </div>
  );
};

export default Calculator;
