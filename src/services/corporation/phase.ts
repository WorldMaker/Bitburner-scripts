import { Company } from '../../models/corporation'
import { Logger } from '../../models/logger'
import { MaterialRound0Manager } from './material-round-0'
import { UnstartedPhaseManager } from './unstarted'

export interface PhaseManager {
	summarize(): string
	manage(): Promise<void>
}

export function getPhaseManager(ns: NS, logger: Logger, company: Company) {
	switch (company.getState()) {
		case 'Unstarted':
			return new UnstartedPhaseManager(ns, logger, company)
		case 'Material0Round':
			return new MaterialRound0Manager(ns, logger, company)
	}
}
