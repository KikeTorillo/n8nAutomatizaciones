import { memo } from 'react';
import { LoadingSpinner } from '../../atoms/LoadingSpinner';

const DetailLoadingState = memo(function DetailLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  );
});

DetailLoadingState.displayName = 'DetailLoadingState';

export { DetailLoadingState };
