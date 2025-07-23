/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { Week } from '../../types/redux/weeks';
import EditWeekModalComponent from './EditWeekModalComponent';

interface WeekViewComponentProps {
	week: Week;
}

/**
 * Defines the weekly pattern info card
 * @param props defined above
 * @returns Single weekly pattern element
 */
export default function WeekViewComponent(props: WeekViewComponentProps): React.ReactElement {

	const { week } = props;

	const [showEditModal, setShowEditModal] = React.useState(false);

	return (
		<div className="card">
			<div className="identifier-container">{week.weekName}</div>
			<div className="item-container p-2">
				<b><FormattedMessage id="note" /></b> {week.note}
			</div>
			<div className="edit-btn">
				<Button color="secondary" onClick={() => setShowEditModal(true)}>
					<FormattedMessage id="week.edit" />
				</Button>

				<EditWeekModalComponent show={showEditModal} week={week} handleClose={() => setShowEditModal(false)} />
			</div>
		</div>
	);
}
