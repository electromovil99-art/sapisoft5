
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, RotateCw, RotateCcw, Save, Trash2, X, Sliders, Check, LayoutTemplate, Monitor } from 'lucide-react';

interface MediaEditorProps {
    onUpdateHeroImage?: (url: string) => void;
    onUpdateFeatureImage?: (url: string) => void;
}

interface ImageAsset {
    id: string;
    url: string;
    name: string;
}

const MediaEditorModule: React.FC<MediaEditorProps> = ({ onUpdateHeroImage, onUpdateFeatureImage }) => {
    const [images, setImages] = useState<ImageAsset[]>([
        { id: '1', name: 'Dashboard Default', url: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2670&auto=format&fit=crop' },
        { id: '2', name: 'Stock Tablet', url: 'https://images.unsplash.com/photo-1580508174046-170816f65662?q=80&w=2670&auto=format&fit=crop' },
        { id: '3', name: 'Oficina', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2670&auto=format&fit=crop' }
    ]);
    const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
    
    // Editor State
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [grayscale, setGrayscale] = useState(0);
    const [sepia, setSepia] = useState(0);
    const [rotation, setRotation] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset edit state when selecting new image
    useEffect(() => {
        if(selectedImage) {
            setBrightness(100);
            setContrast(100);
            setGrayscale(0);
            setSepia(0);
            setRotation(0);
        }
    }, [selectedImage]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newImage = {
                id: Math.random().toString(),
                name: file.name,
                url: url
            };
            setImages([newImage, ...images]);
        }
    };

    const handleDelete = (id: string) => {
        setImages(images.filter(img => img.id !== id));
        if (selectedImage?.id === id) setSelectedImage(null);
    };

    // This simulates saving by creating a derived style string, but for real app we might canvas draw.
    // For this demo, we just alert success and allow setting as login image.
    const handleSaveCopy = () => {
        alert("Imagen editada guardada en biblioteca (Simulación).");
        // In a real app, you'd draw to canvas and export blob
    };

    const getFilterString = () => {
        return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`;
    };

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar: Gallery */}
            <div className="w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ImageIcon size={18} className="text-purple-500"/> Galería
                    </h3>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1 text-xs font-bold" title="Subir Imagen">
                        <Upload size={14}/> Agregar
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload}/>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start">
                    {images.map(img => (
                        <div 
                            key={img.id} 
                            onClick={() => setSelectedImage(img)}
                            className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedImage?.id === img.id ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'}`}
                        >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Editor */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
                {selectedImage ? (
                    <>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center p-8 overflow-hidden relative checkerboard-bg">
                            {/* Editor Canvas */}
                            <div 
                                className="relative shadow-2xl transition-transform duration-300 ease-out origin-center max-w-full max-h-full"
                                style={{ 
                                    transform: `rotate(${rotation}deg)`,
                                    filter: getFilterString()
                                }}
                            >
                                <img src={selectedImage.url} alt="Editing" className="max-w-full max-h-[60vh] object-contain rounded-lg"/>
                            </div>
                        </div>

                        {/* Controls Panel */}
                        <div className="h-64 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 flex gap-8">
                            
                            {/* Sliders */}
                            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between">Brillo <span>{brightness}%</span></label>
                                    <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between">Contraste <span>{contrast}%</span></label>
                                    <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between">B/N <span>{grayscale}%</span></label>
                                    <input type="range" min="0" max="100" value={grayscale} onChange={e => setGrayscale(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex justify-between">Sepia <span>{sepia}%</span></label>
                                    <input type="range" min="0" max="100" value={sepia} onChange={e => setSepia(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"/>
                                </div>
                            </div>

                            {/* Rotation & Actions */}
                            <div className="w-64 flex flex-col gap-4 border-l border-slate-100 dark:border-slate-700 pl-8">
                                <div className="flex gap-2">
                                    <button onClick={() => setRotation(r => r - 90)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex justify-center"><RotateCcw size={18}/></button>
                                    <button onClick={() => setRotation(r => r + 90)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex justify-center"><RotateCw size={18}/></button>
                                </div>
                                
                                <button onClick={handleSaveCopy} className="w-full py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
                                    <Save size={16}/> Guardar Edición
                                </button>

                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <button 
                                        onClick={() => onUpdateHeroImage && onUpdateHeroImage(selectedImage.url)} 
                                        className="w-full py-2 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded-lg font-bold text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center gap-2"
                                    >
                                        <LayoutTemplate size={14}/> Establecer como Portada
                                    </button>
                                    <button 
                                        onClick={() => onUpdateFeatureImage && onUpdateFeatureImage(selectedImage.url)} 
                                        className="w-full py-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-2"
                                    >
                                        <Monitor size={14}/> Establecer como Secundaria
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <Sliders size={48} className="text-slate-300 dark:text-slate-600"/>
                        </div>
                        <p className="font-bold text-lg">Selecciona una imagen para editar</p>
                        <p className="text-sm">Puedes ajustar brillo, filtros y rotación.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaEditorModule;
