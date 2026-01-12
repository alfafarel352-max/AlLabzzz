import { html } from '../utils/html.js';
import { Box, FileCode, File, Trash2, Download, UploadCloud, AlertCircle } from 'lucide-react';

export const RobloxIcon = ({ className }) => {
  return html`
    <svg 
      className=${className} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.5 5H5.5L3 18.5H21L18.5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <path d="M9.5 9.5H14.5V14.5H9.5V9.5Z" fill="currentColor"/>
    </svg>
  `;
};

export { Box, FileCode, File, Trash2, Download, UploadCloud, AlertCircle };