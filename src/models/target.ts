import { BaseServer } from './server'

export type TargetDirection = 'weaken' | 'grow' | 'hack'

/**
 * Finds the next target direction
 *
 * Target direction is a simple state machine based on [security, money].
 *
 * ```
 * weaken [start]
 * weaken -> grow [low on money]
 * weaken -> hack [has enough money]
 * grow -> weaken [high security]
 * grow -> hack [has enough money]
 * hack -> weaken [low on money or high security; cycle]
 * ```
 *
 * @returns New direction
 */
export function findTargetDirection(
	target: BaseServer,
	currentDirection: TargetDirection
) {
	const securityLevel = target.checkSecurityLevel()
	const money = target.checkMoneyAvailable()
	switch (currentDirection) {
		case 'weaken':
			if (Math.round(securityLevel) === target.getMinSecurityLevel()) {
				if (money > target.getMoneyThreshold()) {
					return 'hack'
				} else {
					return 'grow'
				}
			}
			break
		case 'grow':
			if (
				securityLevel > target.getSecurityThreshold() ||
				money >= target.getWorth()
			) {
				if (money > target.getMoneyThreshold()) {
					return 'hack'
				} else {
					return 'weaken'
				}
			}
			break
		case 'hack':
			if (
				securityLevel > target.getSecurityThreshold() ||
				money < target.getMoneyThreshold()
			) {
				return 'weaken'
			}
			break
	}
	return currentDirection
}
