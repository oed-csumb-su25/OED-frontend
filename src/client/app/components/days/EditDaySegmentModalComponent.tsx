/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { DaySegment } from '../../types/redux/days';


/**
 * Given an hour in range [0, 24], returns the time in format HH:MM{AM|PM}
 * @param hour The hour to transform
 * @returns time in format HH:MM{AM|PM}
 */
function hourToTime(hour: number) {
	const suffix = hour === 0 || hour === 24 ? 'AM' : hour < 12 ? 'AM' : 'PM';
	let displayHour = hour % 12;
	if (displayHour === 0) {
		displayHour = 12;
	}
	return `${displayHour}:00 ${suffix}`;
}

interface EditDaySegmentModalComponentProps {
	/**
	 * The week to edit
	 */
	daySegment: DaySegment;
}

/**
 * /**
 * Defines a modal that allows editing of an existing Day Segment.
 * @param props - The properties for the component
 * @returns Day segment edit element
 */
export default function EditDaySegmentModalComponent(props: EditDaySegmentModalComponentProps): React.ReactElement {
	const [daySegment, setDaySegment] = React.useState({ ...props.daySegment });

	const [showEditModal, setShowEditModal] = React.useState(false);

	const [editDaySegmentMutation, { isLoading: isSaving }] = daySegmentsApi.useEditDailyPatternSegmentMutation();

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDaySegment({ ...daySegment, [e.target.name]: e.target.value });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDaySegment({ ...daySegment, [e.target.name]: Number(e.target.value) });
	};

	const handleSubmit = () => {
		editDaySegmentMutation(daySegment).unwrap()
			.then(() => {
				handleHideEditModal();
			});
	};

	const handleShowEditModal = () => setShowEditModal(true);
	const handleHideEditModal = () => setShowEditModal(false);

	return (
		<>
			<Button color="secondary" size="sm" onClick={handleShowEditModal}>
				<FormattedMessage id="edit" />
			</Button>

			<Modal isOpen={showEditModal} toggle={handleHideEditModal} backdrop="static">
				<ModalHeader toggle={handleHideEditModal}>
					<FormattedMessage id="edit.segment.title" />
				</ModalHeader>
				<ModalBody>
					<strong>{hourToTime(daySegment.startHour)} - {hourToTime(daySegment.endHour)}</strong>

					<FormGroup>
						<Label for="slope">Slope</Label>
						<Input
							id="slope"
							name="slope"
							type="number"
							required
							value={daySegment.slope}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="intercept">Intercept</Label>
						<Input
							id="intercept"
							name="intercept"
							type="number"
							required
							value={daySegment.intercept}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="note">Note</Label>
						<Input
							id="note"
							name="note"
							type="textarea"
							value={daySegment.note ?? ''}
							onChange={handleStringChange}
						/>
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					{/* Discard changes */}
					<Button color="secondary" onClick={handleHideEditModal}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* Save changes */}
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={isSaving}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
