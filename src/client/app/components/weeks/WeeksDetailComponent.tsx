/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { titleStyle } from '../../styles/modalStyle';
import TooltipHelpComponent from '../TooltipHelpComponent';
import CreateWeekModalComponent from './CreateWeekModalComponent';
import { fakeWeeksData } from './fake-week-data';
import WeekViewComponent from './WeekViewComponent';

/**
 * Defines the weekly patterns page
 * @returns Weekly patterns page element
 */
export default function WeeksDetailComponent() {
	// const locale = useAppSelector(selectSelectedLanguage);

	// TODO (evan-carey): Replace with real weeks data
	const weeks = fakeWeeksData;

	return (
		<div className="flexGrowOne">
			<div>
				<TooltipHelpComponent page='weeks' />

				<div className="container-fluid">
					<h2 style={titleStyle}>
						<FormattedMessage id='weeks' />
					</h2>
					<div className="edit-btn">
						<CreateWeekModalComponent />
					</div>
					<div className="card-container">
						{/* TODO (evan-carey): sort weeks? */}
						{weeks.map(week => <WeekViewComponent week={week} key={week.id} />)}
					</div>
				</div>
			</div>
		</div>
	);
}
