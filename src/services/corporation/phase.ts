import { Company } from '../../models/corporation'
import { Logger } from '../../models/logger'
import { MaterialRound0Manager } from './material-round-0'
import { MaterialRound1Manager } from './material-round-1'
import { MaterialRound2Manager } from './material-round-2'
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
		case 'Material1Round':
			return new MaterialRound1Manager(ns, logger, company)
		case 'Material2Round':
			return new MaterialRound2Manager(ns, logger, company)
	}
}
