import { Company } from '../../models/corporation'
import { MaterialRound0Manager } from './material-round-0'
import { MaterialRound1Manager } from './material-round-1'
import { MaterialRound2Manager } from './material-round-2'
import { ProductRound2Manager } from './product-round-2'
import { ProductRound3Manager } from './product-round-3'
import { ProductRound4Manager } from './product-round-4'
import { UnstartedPhaseManager } from './unstarted'

export interface PhaseManager {
	summarize(): string | void
	manage(): Promise<void>
}

export function getPhaseManager(company: Company) {
	switch (company.getState()) {
		case 'Unstarted':
			return new UnstartedPhaseManager(company)
		case 'Material0Round':
			return new MaterialRound0Manager(company)
		case 'Material1Round':
			return new MaterialRound1Manager(company)
		case 'Material2Round':
			return new MaterialRound2Manager(company)
		case 'Product2Round':
			return new ProductRound2Manager(company)
		case 'Product3Round':
			return new ProductRound3Manager(company)
		case 'Product4Round':
			return new ProductRound4Manager(company)
	}
}
