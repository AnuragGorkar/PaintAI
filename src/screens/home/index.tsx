import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { X } from 'lucide-react';

interface GeneratedResult {
    expression: string;
    answer: string;
}

const ResultPopup = ({ results, onClose }) => {
    useEffect(() => {
      if (window.MathJax) {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }
    }, [results]);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-black border-2 border-gray-600 rounded-lg p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-2xl font-bold">Results</h2>
            <button onClick={onClose} className="text-white hover:text-gray-300">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-gray-800 rounded p-4">
                <div className="text-white mb-2">Expression:</div>
                <div className="latex-content text-white mb-4">{result.expr}</div>
                <div className="text-white mb-2">Result:</div>
                <div className="latex-content text-white">{result.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState([]);

    const SWATCHES = [
        "#000000", "#ffffff", "#808080", "#ee3333",  
        "#e64980", "#be4bdb", "#893200", "#228be6",  
        "#3333ee", "#00aa00", "#fab005", "#fd7e14"
    ];

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.type.startsWith('touch')) {
            const touch = (event as React.TouchEvent).touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = (event as React.MouseEvent).clientX;
            clientY = (event as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const initializeCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.lineCap = 'round';
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = color;
                }
            }
        }
    };

    useEffect(() => {
        const handleResize = () => {
            initializeCanvas();
        };

        window.addEventListener('resize', handleResize);
        initializeCanvas();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        initializeCanvas();
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (reset) {
            initializeCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const coords = getCoordinates(event);
        setLastPos(coords);
        setIsDrawing(true);
        
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(coords.x, coords.y);
            }
        }
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        if (!isDrawing) return;
        
        const coords = getCoordinates(event);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(coords.x, coords.y);
                ctx.stroke();
                setLastPos(coords);
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const runRoute = async () => { 
        const canvas = canvasRef.current;
    
        if (canvas) {
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars
                }
            });
    
            const resp = await response.data;
            console.log('Response', resp);
    
            if (resp.status === "success" && resp.data) {
                setResults(resp.data); // Store the 'data' array as 'results'
                setShowResults(true); // Show the popup
            }
        }
    };
    

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <div className="fixed top-0 w-full p-2 z-20">
                <div className="hidden md:flex w-full items-center justify-between px-4">
                    <a href="https://adgorkar.vercel.app/" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden 
                                      shadow-[0_0_25px_rgba(147,51,234,1),_0_0_50px_rgba(147,51,234,0.7),_0_0_100px_rgba(147,51,234,0.5)]
                                      transition-transform duration-300 hover:scale-105">
                            <img 
                                src="src/assets/profileimage.png" 
                                alt="Logo" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </a>

                    <div className="flex items-center gap-4 mx-auto">
                        <Button
                            onClick={() => setReset(true)}
                            className="bg-black text-white shadow-md rounded-full border-2 border-gray-600 
                                     flex items-center justify-center font-semibold text-base
                                     w-[100px] h-[48px]"
                            variant="default"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            <span>Reset</span>
                        </Button>

                        <div className="border-2 border-gray-600 rounded-full p-2
                                     grid grid-cols-12 gap-2
                                     bg-black/50 backdrop-blur-sm">
                            {SWATCHES.map((swatch: string) => (
                                <div
                                    key={swatch}
                                    onClick={() => setColor(swatch)}
                                    className="w-[30px] h-[30px] rounded-full cursor-pointer
                                             border border-gray-600 transition-transform
                                             hover:scale-110 hover:shadow-lg"
                                    style={{ 
                                        backgroundColor: swatch,
                                        boxShadow: color === swatch ? '0 0 0 2px white' : 'none'
                                    }}
                                />
                            ))}
                        </div>

                        <Button
                            onClick={runRoute}
                            className="bg-black text-white shadow-md rounded-full border-2 border-gray-600 
                                     flex items-center justify-center font-semibold text-base
                                     w-[100px] h-[48px]"
                            variant="default"
                        >
                            <img 
                                src="src/assets/Gemini Logo.png" 
                                alt="AI" 
                                className="w-6 h-6 mr-2" 
                            />
                            <span>Solve</span>
                        </Button>
                    </div>
                </div>

                 <div className="md:hidden flex flex-col h-screen">
                    <a href="https://adgorkar.vercel.app/" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="self-center mb-4 mr-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden 
                                      shadow-[0_0_25px_rgba(147,51,234,1),_0_0_50px_rgba(147,51,234,0.7),_0_0_100px_rgba(147,51,234,0.5)]
                                      transition-transform duration-300 hover:scale-105">
                            <img 
                                src="src/assets/profileimage.png" 
                                alt="Logo" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </a>

                    <div className="flex flex-col gap-3 items-start pl-2">
                        <Button
                            onClick={() => setReset(true)}
                            className="bg-black text-white shadow-md rounded-full border-2 border-gray-600 
                                     flex items-center justify-center
                                     w-[52px] h-[52px]"
                            variant="default"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </Button>

                        <Button
                            onClick={runRoute}
                            className="bg-black text-white shadow-md rounded-full border-2 border-gray-600 
                                     flex items-center justify-center w-[52px] h-[52px]"
                            variant="default"
                        >
                            <img 
                                src="src/assets/Gemini Logo.png" 
                                alt="AI" 
                                style={{ width: '22px', height: '20px' }}
                            />
                        </Button>

                        <div className="border-2 border-gray-600 rounded-full p-2
                                     flex flex-col gap-2
                                     bg-black/50 backdrop-blur-sm">
                            {SWATCHES.map((swatch: string) => (
                                <div
                                    key={swatch}
                                    onClick={() => setColor(swatch)}
                                    className="w-[30px] h-[30px] rounded-full cursor-pointer
                                             border border-gray-600 transition-transform
                                             hover:scale-110 hover:shadow-lg"
                                    style={{ 
                                        backgroundColor: swatch,
                                        boxShadow: color === swatch ? '0 0 0 2px white' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                id="canvas"
                className="absolute top-0 left-0 w-full h-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-2 text-white rounded shadow-md">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}

            {showResults && (
                <ResultPopup
                    results={results}
                    onClose={() => setShowResults(false)}
                />
            )}
        </div>
    );
}