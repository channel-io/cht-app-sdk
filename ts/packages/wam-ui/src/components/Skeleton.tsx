import styled, { keyframes } from "styled-components";

const wave = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

export interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export interface SkeletonCircleProps {
  size?: number;
}

interface StyledSkeletonBoxProps {
  $width?: number | string;
  $height?: number;
  $borderRadius?: number;
}

const StyledSkeletonBox = styled.div<StyledSkeletonBoxProps>`
  background: var(--color-fill-neutral-lighter);
  overflow: hidden;
  position: relative;
  width: ${({ $width }) =>
    $width !== undefined ? (typeof $width === "number" ? `${$width}px` : $width) : undefined};
  flex: ${({ $width }) => ($width === undefined ? 1 : undefined)};
  height: ${({ $height }) => ($height !== undefined ? `${$height}px` : "16px")};
  border-radius: ${({ $borderRadius }) =>
    $borderRadius !== undefined ? `${$borderRadius}px` : "3px"};

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: ${wave} 1.5s linear infinite;
  }
`;

export function SkeletonBox({ width, height, borderRadius = 3 }: SkeletonBoxProps) {
  return (
    <StyledSkeletonBox
      $width={width}
      $height={height}
      $borderRadius={borderRadius}
      data-testid="skeleton-box"
    />
  );
}

export function SkeletonCircle({ size = 40 }: SkeletonCircleProps) {
  return (
    <StyledSkeletonBox
      $width={size}
      $height={size}
      $borderRadius={size / 2}
      data-testid="skeleton-circle"
    />
  );
}
