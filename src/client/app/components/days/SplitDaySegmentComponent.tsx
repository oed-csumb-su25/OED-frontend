/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, FormFeedback, Input, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { DaySegment } from '../../types/redux/days';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';

interface SplitDaySegmentComponentProps {
	/**
	 * The direction to split the segment
	 */
	direction: 'earlier' | 'later';

	/**
	 * The day segment to split
	 */
	daySegment: DaySegment;
}

/**
 * Defines a button that opens a modal to split a day segment into two segments.
 * The split can be done earlier or later based on the direction prop.
 * @param props The properties for the component
 * @returns A button element
 */
export default function SplitDaySegmentComponent(props: SplitDaySegmentComponentProps): React.ReactElement {

	const [splitHour, setSplitHour] = React.useState<number>(props.daySegment.startHour + 1);

	const [showEditModal, setShowEditModal] = React.useState(false);

	const [editDaySegmentMutation, { isLoading: isEditSaving }] = daySegmentsApi.useEditDailyPatternSegmentMutation();

	const [addDaySegmentMutation, { isLoading: isAddSaving }] = daySegmentsApi.useAddDailyPatternSegmentMutation();

	const handleShowEditModal = () => setShowEditModal(true);
	const handleHideEditModal = () => setShowEditModal(false);

	const handleSplitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSplitHour(Number(e.target.value));
	};

	const isSplitValid = React.useMemo(() => {
		if (!Number.isInteger(splitHour)) {
			return false;
		}
		return splitHour > props.daySegment.startHour && splitHour < props.daySegment.endHour;

	}, [splitHour, props.daySegment, props.direction]);

	const handleSplitSegment = () => {
		if (!isSplitValid) {
			return;
		}

		const editSegment: DaySegment = {
			...props.daySegment,
			startHour: props.direction === 'earlier' ? splitHour : props.daySegment.startHour,
			endHour: props.direction === 'earlier' ? props.daySegment.endHour : splitHour
		};
		const newSegment: Omit<DaySegment, 'id'> = {
			dayId: props.daySegment.dayId,
			slope: 0,
			intercept: 0,
			startHour: props.direction === 'earlier' ? props.daySegment.startHour : splitHour,
			endHour: props.direction === 'earlier' ? splitHour : props.daySegment.endHour
		};

		const editPromise = editDaySegmentMutation(editSegment).unwrap();
		const addPromise = addDaySegmentMutation(newSegment).unwrap();

		Promise.all([editPromise, addPromise])
			.then(() => {
				handleHideEditModal();
			})
			.catch(error => {
				showErrorNotification(error);
			});
	};

	return (
		<>
			<Button size="sm" onClick={handleShowEditModal}>
				<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
			</Button>

			<Modal isOpen={showEditModal} toggle={handleHideEditModal} backdrop="static" >
				<ModalHeader>
					<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
				</ModalHeader>
				<ModalBody>
					<p><FormattedMessage id="split.hour.prompt" /></p>
					<Input
						id="split"
						type="number"
						min={props.daySegment.startHour + 1}
						max={props.daySegment.endHour - 1}
						step="1"
						onChange={handleSplitInputChange}
						placeholder={props.daySegment.startHour + 1 + ' - ' + (props.daySegment.endHour - 1)}
						invalid={!isSplitValid}
					/>
					<FormFeedback>
						{!isSplitValid && translate('split.hour.invalid')
  							.replace('{start}', String(props.daySegment.startHour + 1))
  							.replace('{end}', String(props.daySegment.endHour - 1))}
					</FormFeedback>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={handleHideEditModal}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button
						color="primary"
						onClick={handleSplitSegment}
						disabled={!isSplitValid || isEditSaving || isAddSaving}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

