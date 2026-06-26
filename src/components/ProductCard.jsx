import React, { useState } from 'react';
import { Plus, Minus, Check, Cookie, Flame, Sparkles, Droplet, Gift, Package } from 'lucide-react';

const CATEGORY_ICONS = {
  Biscuits: Cookie,
  Chips: Flame,
  Namkeens: Flame,
  Chocolates: Gift,
  Soaps: Sparkles,
  Shampoos: Droplet
};

const CATEGORY_GRADIENTS = {
  Biscuits: 'from-amber-100 to-amber-200 text-amber-800',
  Chips: 'from-red-100 to-orange-200 text-red-800',
  Namkeens: 'from-orange-100 to-yellow-200 text-orange-800',
  Chocolates: 'from-purple-100 to-indigo-200 text-purple-800',
  Soaps: 'from-cyan-100 to-teal-200 text-cyan-800',
  Shampoos: 'from-blue-100 to-indigo-200 text-blue-800'
};

export default function ProductCard({ product, cartQty, onAdd, onUpdateQty, onViewDetails }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const Icon = CATEGORY_ICONS[product.category] || Package;
  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-blue-100 to-indigo-200 text-blue-800';

  const wholesaleUnit = String(product?.wholesaleUnit || '').toLowerCase();
  const packQuantity = parseInt(product?.packQuantity) || 1;
  const stockQty = product?.stockQty !== undefined ? parseInt(product.stockQty) : 0;

  const alertLimit = product?.minStock !== undefined && product?.minStock !== null ? parseInt(product.minStock) : 10;
  let availablePacks = 0;
  const isPack = wholesaleUnit.includes('pack') || wholesaleUnit.includes('box');
  if (isPack) {
    const pQty = packQuantity > 0 ? packQuantity : 1;
    availablePacks = Math.floor(stockQty / pQty);
  } else {
    availablePacks = stockQty;
  }

  console.log("[ProductCard] details:", {
    stockQty,
    packQuantity,
    availablePacks,
    productId: product?.id
  });

  const isOutOfStock = availablePacks <= 0;

  const mrp = product?.mrp !== undefined ? product.mrp : (product?.price !== undefined ? product.price * 1.25 : 0);
  const multiplier = (product?.wholesaleUnit === 'Pack' || product?.wholesaleUnit === 'Box') ? (parseInt(product?.packQuantity) || 12) : 1;
  const unitMrp = Math.round(mrp * multiplier);

  return (
    <div 
      onClick={() => onViewDetails && onViewDetails(product)}
      className="custom-card custom-card-hover flex flex-col overflow-hidden group cursor-pointer"
    >
      
      {/* Inset Floating Image Area */}
      <div className="relative aspect-square bg-gray-50/50 overflow-hidden flex-shrink-0 flex items-center justify-center rounded-2xl m-3.5 border border-brand/5 shadow-inner">
        {(!(product.imageUrl || product.image) || imgFailed) ? (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4`}>
            <Icon className="h-10 w-10 mb-1.5 opacity-90 stroke-[1.5]" />
            <span className="text-[9px] font-black tracking-widest uppercase opacity-75">{product.category}</span>
          </div>
        ) : (
          <img
            src={product.imageUrl || product.image}
            alt={product.name}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Brand Tag */}
        <span className="absolute top-2.5 left-2.5 bg-accent text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
          {product.brand}
        </span>

        {/* Stock Status Badge */}
        <span className="absolute top-2.5 right-2.5 text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm bg-red-500 text-white" style={{
          backgroundColor: isOutOfStock 
            ? '#ef4444' 
            : availablePacks <= alertLimit
              ? '#f97316'
              : '#10b981'
        }}>
          {isOutOfStock ? 'Out Of Stock' : (availablePacks <= alertLimit ? 'Low Stock' : 'In Stock')}
        </span>
      </div>

      {/* Info & Action Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3 bg-transparent">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 h-10 leading-snug group-hover:text-brand transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium">{product.unit}</p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-base sm:text-lg font-black text-brand">
                ₹{(product.wholesalePrice !== undefined ? product.wholesalePrice : (product.price || 0)) * ((product.wholesaleUnit === 'Pack' || product.wholesaleUnit === 'Box') ? (parseInt(product.packQuantity) || 12) : 1)}
              </span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Wholesale</span>
            </div>
            {unitMrp > 0 && (
              <span className="text-[11px] font-bold">
                <span className="text-gray-400">MRP </span>
                <span className="text-red-500 line-through">₹{unitMrp}</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed h-8 overflow-hidden">
            {product.description || '\u00A0'}
          </p>

          {/* Action Button/Controls */}
          {isOutOfStock ? (
            <button
              disabled
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed border h-9 flex items-center justify-center gap-1"
            >
              Out of Stock
            </button>
          ) : cartQty > 0 ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between bg-brand-light rounded-full p-1 border border-brand/20 shadow-inner h-9"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQty(product.id, cartQty - 1);
                }}
                className="bg-white hover:bg-brand text-brand hover:text-white rounded-full p-1.5 transition active:scale-90 flex items-center justify-center border border-brand/5 shadow-sm cursor-pointer"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-black text-brand-dark px-1.5">{cartQty}</span>
              <button
                disabled={cartQty >= availablePacks}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQty(product.id, cartQty + 1);
                }}
                className={`bg-white hover:bg-brand text-brand hover:text-white rounded-full p-1.5 transition active:scale-90 flex items-center justify-center border border-brand/5 shadow-sm cursor-pointer ${cartQty >= availablePacks ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className={`w-full py-2 px-3 rounded-full text-xs font-black transition-all duration-250 flex items-center justify-center gap-1 border shadow-sm h-9 cursor-pointer active-bounce ${
                justAdded
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-brand hover:bg-brand-dark border-transparent text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
