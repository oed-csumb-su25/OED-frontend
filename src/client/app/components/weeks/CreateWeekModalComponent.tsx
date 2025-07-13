/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table } from 'reactstrap';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateWeekValues } from '../../redux/selectors/adminSelectors';
import translate from '../../utils/translate';
import { fakeDaysData } from './fake-week-data';

/**
 * Defines a button that opens a modal to create a new weekly conversion pattern.
 * @returns Weekly pattern create element
 */
export default function CreateWeekModalComponent(): React.ReactElement {

	const [showModal, setShowModal] = React.useState(false);

	const defaultValues = useAppSelector(selectDefaultCreateWeekValues);

	const [weekDetails, setWeekDetails] = React.useState(defaultValues);

	// reference to the submit button
	const submitButtonRef = React.useRef<HTMLButtonElement>(null);

	const onToggleModal = () => {
		setShowModal(!showModal);
		if (showModal) {
			resetState();
		}
	};

	const handleSubmit = () => {
		// prevent multiple submissions
		submitButtonRef.current?.setAttribute('disabled', 'true');

		// TODO (evan-carey): Add logic to save the week details
		console.log('Week details submitted:', weekDetails);
	};

	const resetState = () => {
		setWeekDetails(defaultValues);
	};

	// TODO (evan-carey): Add validation logic
	const isValidWeek = true;

	return (
		<>
			{/* Show cerate modal button */}
			<Button color="secondary" onClick={onToggleModal}>
				<FormattedMessage id="week.create" />
			</Button>


			<Modal isOpen={showModal} toggle={onToggleModal} backdrop="static">
				<ModalHeader toggle={onToggleModal}>
					<FormattedMessage id="week.create" />
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
														// TODO (evan-carey): change if the day ID is a number instead of a string
														invalid={weekDetails[day] === '-1'}
														onChange={event => setWeekDetails({ ...weekDetails, [day]: event.target.value })}
													>
														<option value="-1" key="" hidden={weekDetails[day] !== '-1'} disabled>
															{translate('select.day')}
														</option>
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
					<Button color="secondary" onClick={onToggleModal}>
						<FormattedMessage id="discard.changes" />
					</Button>
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
