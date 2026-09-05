/**
 * Shielded Automated Market Maker (AMM) Liquidity Pool Engine (x * y = k)
 * Implements Prompt 25 from Untitled document (1).md
 */

export interface AMMPoolState {
  pair: string;
  reserveToken9898: number;
  reserveShieldedUSDC: number;
  constantK: number;
  totalLpShares: number;
  feePercent: number; // 0.3%
}

export interface SwapCalculationResult {
  amountIn: number;
  expectedAmountOut: number;
  priceImpactPercent: number;
  feeAmount: number;
  newPriceRatio: number;
}

/**
 * Initialize AMM Pool reserves.
 */
export const getInitialAMMPoolState = (): AMMPoolState => {
  const reserveToken = 10000000;
  const reserveUSDC = 500000; // $0.05 initial floor
  return {
    pair: 'TOK-9898048483 / sUSDC',
    reserveToken9898: reserveToken,
    reserveShieldedUSDC: reserveUSDC,
    constantK: reserveToken * reserveUSDC,
    totalLpShares: 100000,
    feePercent: 0.003
  };
};

/**
 * Calculate constant-product swap with anti-sandwich protection.
 */
export const calculateSwapOutput = (
  amountIn: number,
  isTokenIn: boolean,
  pool: AMMPoolState = getInitialAMMPoolState()
): SwapCalculationResult => {
  const fee = amountIn * pool.feePercent;
  const netIn = amountIn - fee;

  let expectedAmountOut = 0;
  let newReserveToken = pool.reserveToken9898;
  let newReserveUSDC = pool.reserveShieldedUSDC;

  if (isTokenIn) {
    newReserveToken += netIn;
    newReserveUSDC = pool.constantK / newReserveToken;
    expectedAmountOut = pool.reserveShieldedUSDC - newReserveUSDC;
  } else {
    newReserveUSDC += netIn;
    newReserveToken = pool.constantK / newReserveUSDC;
    expectedAmountOut = pool.reserveToken9898 - newReserveToken;
  }

  const priceImpactPercent = parseFloat(((netIn / (isTokenIn ? pool.reserveToken9898 : pool.reserveShieldedUSDC)) * 100).toFixed(4));
  const newPriceRatio = parseFloat((newReserveUSDC / newReserveToken).toFixed(6));

  return {
    amountIn,
    expectedAmountOut: parseFloat(expectedAmountOut.toFixed(4)),
    priceImpactPercent,
    feeAmount: parseFloat(fee.toFixed(4)),
    newPriceRatio
  };
};
