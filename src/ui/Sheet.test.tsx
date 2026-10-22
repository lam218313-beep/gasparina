// @vitest-environment jsdom
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Sheet } from '@/ui/Sheet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** La forma natural de usar la hoja: el texto vive en el padre y onClose va en línea. */
const Harness: React.FC<{ onEscape?: (textoAlCerrar: string) => void }> = ({ onEscape }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  return (
    <>
      <button type="button" id="abrir" onClick={() => setOpen(true)}>Abrir</button>
      <Sheet open={open} title="Capturar" onClose={() => { onEscape?.(text); setOpen(false); }}>
        <textarea aria-label="Texto" value={text} onChange={(e) => setText(e.target.value)} />
      </Sheet>
    </>
  );
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const montar = (onEscape?: (textoAlCerrar: string) => void) => act(() => root.render(<Harness onEscape={onEscape} />));
const abrir = () => {
  const boton = container.querySelector<HTMLButtonElement>('#abrir')!;
  act(() => { boton.focus(); boton.click(); });
  return boton;
};
const campo = () => document.querySelector<HTMLTextAreaElement>('textarea')!;
const escribir = (el: HTMLTextAreaElement, texto: string) => {
  const poner = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
  act(() => { poner.call(el, texto); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const escape = () => act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });

describe('Sheet', () => {
  it('no le quita el foco al campo cuando el padre se vuelve a pintar con un onClose en línea', () => {
    montar();
    abrir();
    campo().focus();
    let escrito = '';
    for (const letra of 'Llamar al banco') {
      escrito += letra;
      escribir(campo(), escrito);
      expect(document.activeElement).toBe(campo());
    }
    expect(campo().value).toBe('Llamar al banco');
  });

  it('Escape llama al onClose más reciente, no al de cuando se abrió', () => {
    const vistos: string[] = [];
    montar((texto) => vistos.push(texto));
    abrir();
    escribir(campo(), 'Uno');
    escape();
    expect(vistos).toEqual(['Uno']);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('al cerrar, el foco vuelve al botón que la abrió y la página puede volver a desplazarse', () => {
    montar();
    const boton = abrir();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
    escape();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(boton);
    expect(document.body.style.overflow).toBe('');
  });
});
