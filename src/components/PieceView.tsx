import React from 'react';
import { PieceDetail } from './PieceDetail';
import { PieceData, RouteStop } from '../types';

interface PieceViewProps {
  piece: PieceData;
  hasPass: boolean;
  passPriceMxn: number;
  onOpenPaywall: () => void;
  currentStopIndex?: number;
  totalStops?: number;
  roomName?: string;
  nextStop?: RouteStop | null;
  onNextStop?: () => void;
  onPreviousStop?: () => void;
  onOpenMapModal?: () => void;
  roomPieces?: any[];
  onSelectPiece?: (pieceId: string) => void;
  currentRoom?: any;
}

export const PieceView: React.FC<PieceViewProps> = (props) => {
  return <PieceDetail {...props} />;
};

export { PieceDetail };
export default PieceView;
