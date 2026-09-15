import React from 'react';
import { PieceDetail } from './PieceDetail';
import { PieceData } from '../types';

interface PieceViewProps {
  piece: PieceData;
  hasPass: boolean;
  passPriceMxn: number;
  onOpenPaywall: () => void;
}

export const PieceView: React.FC<PieceViewProps> = (props) => {
  return <PieceDetail {...props} />;
};

export { PieceDetail };
export default PieceView;
