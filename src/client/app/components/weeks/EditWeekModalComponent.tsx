/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table } from 'reactstrap';
import { Week } from '../../types/redux/weeks';
import translate from '../../utils/translate';
import { fakeDaysData } from './fake-week-data';

interface EditWeekModalComponentProps {
	/**
	 * Whether the modal is visible or not
	 */
	show: boolean;

	week: Week;

	/**
	 * Function to run when edit modal closes
	 */
	handleClose: () => void;
}

/**
 * Defines a modal that allows editing of an existing weekly conversion pattern.
 * @param props - The properties for the component
 * @returns Weekly pattern edit element
 */
export default function EditWeekModalComponent(props: EditWeekModalComponentProps): React.ReactElement {

	const values = { ...props.week };

	const [weekDetails, setWeekDetails] = React.useState(values);

	// reference to the submit button
	const submitButtonRef = React.useRef<HTMLButtonElement>(null);

	const resetState = () => {
		setWeekDetails(values);
	};

	// TODO (evan-carey): Add logic to save changes
	const handleSubmit = () => {
		// prevent multiple submissions
		submitButtonRef.current?.setAttribute('disabled', 'true');

		console.log('Week details submitted:', weekDetails);

		// TODO (evan-carey): Add logic to save the week details, update redux state, close modal, and show success toast
	};

	const handleDelete = () => {
		// TODO (evan-carey): Add logic to delete the week
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};

	// TODO (evan-carey): Add proper validation logic?
	// For now, just check if the name is not empty
	const isValidWeek = weekDetails.name.trim() !== '';

	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} backdrop="static">
				<ModalHeader toggle={props.handleClose}>
					<FormattedMessage id="week.edit" />
				</ModalHeader>
				<ModalBody>
					<Container>
						{/* Name */}
						<Row>
							<Col>
								<FormGroup>
									<Label for="name">{translate('name')}</Label>
									<Input
										id="name"
										type="text"
										name="name"
										required
										value={weekDetails.name}
										invalid={!weekDetails.name}
										onChange={event => setWeekDetails({ ...weekDetails, name: event.target.value })} />
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Note */}
						<Row>
							<Col>
								<FormGroup>
									<Label for="note">{translate('note')}</Label>
									<Input
										id="note"
										type="textarea"
										name="note"
										value={weekDetails.note}
										onChange={event => setWeekDetails({ ...weekDetails, note: event.target.value })} />
								</FormGroup>
							</Col>
						</Row>
						{/* Days */}
						<Row>
							<Col>
								<Table striped bordered>
									<thead>
										<tr>
											<th><FormattedMessage id="day.of.week" /></th>
											<th><FormattedMessage id="day" /></th>
										</tr>
									</thead>
									<tbody>
										{(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map(day => (
											<tr key={day}>
												<td><FormattedMessage id={`day.${day}`} /></td>
												<td>
													<Input
														type="select"
														name={day}
														value={weekDetails[day]}
														invalid={weekDetails[day] === '-1'}
														onChange={event => setWeekDetails({ ...weekDetails, [day]: event.target.value })}
													>
														{/* TODO (evan-carey): populate with real days data */}
														{fakeDaysData.map(fakeDay => (
															<option key={fakeDay.id} value={fakeDay.id}>
																{fakeDay.name}
															</option>
														))}
													</Input>
												</td>
											</tr>
										))}
									</tbody>
								</Table>
							</Col>
						</Row>
					</Container>
				</ModalBody>
				<ModalFooter>
					{/* Delete week */}
					<Button color="danger" onClick={handleDelete}>
						<FormattedMessage id="delete.week" />
					</Button>
					{/* Discard changes */}
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* Save changes */}
					<Button
						color="primary"
						onClick={handleSubmit}
						innerRef={submitButtonRef}
						disabled={!isValidWeek}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
