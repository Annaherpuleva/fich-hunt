import React from 'react';

export interface PromoImageBlockProps {
  image: string;
  alt?: string;
}

const PromoImageBlock: React.FC<PromoImageBlockProps> = ({
  image,
  alt,
}) => (
  <div
    className="relative w-full h-full overflow-hidden rounded-[14px] lg:rounded-[60px]"
  >
    <img
      src={image}
      alt={alt ?? ''}
      className="h-full w-full object-cover"
    />
  </div>
);

export default PromoImageBlock;
