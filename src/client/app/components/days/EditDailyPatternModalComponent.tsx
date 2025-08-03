/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button,
	Col,
	Container,
	FormFeedback,
	FormGroup, Input, Label, Modal, ModalBody, ModalFooter,
	ModalHeader,
	Pagination, PaginationItem, PaginationLink,
	Row,
	Table
} from 'reactstrap';
import { Day, DaySegment, UpdateDaySegmentPayload } from 'types/redux/days';
import { daysApi } from '../../redux/api/daysApi';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { LocaleDataKey } from '../../translations/data';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import EditDaySegmentModalComponent from './EditDaySegmentModalComponent';
import SplitDaySegmentComponent from './SplitDaySegmentComponent';

export interface EditDailyPatternModalComponentProps {
	/**
	 * Whether the modal is visible or not
	 */
	show: boolean;
	/**
	 * The day to edit
	 */
	day: Day;
	/**
	 * Function to run when edit modal closes
	 */
	handleClose: () => void;
}

const PER_PAGE = 10;

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

/**
 * Defines a modal that allows editing of an existing day and its segments, with options to edit, split, and delete them.
 * @param props The properties for the component
 * @returns Day edit element
 */
export default function EditDailyPatternModalComponent(props: EditDailyPatternModalComponentProps) {

	const [dayDetails, setDayDetails] = React.useState({ ...props.day });

	const { data: daySegments = [] } = daySegmentsApi.useGetDailyPatternSegmentsByDayIdQuery(props.day.id);

	// Fetch days data (used to check if day name already exists)
	const { data: days } = daysApi.useGetDailyPatternsQuery();

	const [editDayMutation, { isLoading: isSaving }] = daysApi.useEditDailyPatternMutation();

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDayDetails({ ...dayDetails, [e.target.name]: e.target.value });
	};

	const handleSubmit = () => {
		if (!isDayValid) {
			return;
		}

		editDayMutation(dayDetails).unwrap()
			.then(() => {
				showSuccessNotification(translate('daily.patterns.edit.success'));
				props.handleClose();
			}).catch(error => {
				showErrorNotification(translate('daily.patterns.edit.error'));
			});
	};

	// Pagination
	const [page, setPage] = React.useState(1);
	const totalPages = Math.ceil(daySegments.length ?? 1 / PER_PAGE);
	const paged = daySegments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

	// State to hold validation message for day name
	// This is used to show an error message if the day name is invalid
	const [nameValidationMessageId, setNameValidationMessageId] = React.useState<LocaleDataKey | null>(null);

	// Validate the day name to ensure it is not empty and does not already exist
	const isDayValid = React.useMemo(() => {
		if (dayDetails.name === '') {
			setNameValidationMessageId('daily.patterns.create.name.required');
			return false;
		}
		if (days?.some(day => day.name.toLowerCase() === dayDetails.name.toLowerCase() && day.id !== dayDetails.id)) {
			setNameValidationMessageId('daily.patterns.create.name.exists');
			return false;
		}

		setNameValidationMessageId(null);
		return true;
	}, [dayDetails]);

	// State to hold the modal for editing a day segment
	const [showEditSegmentModal, setShowEditSegmentModal] = React.useState(false);
	const [editSegment, setEditSegment] = React.useState<DaySegment | null>(null);

	// Function to open the edit segment modal
	const handleShowEditSegmentModal = (segment: DaySegment) => {
		setEditSegment(segment);
		setShowEditSegmentModal(true);
	};
	// Function to close the edit segment modal
	const handleCloseEditSegmentModal = () => {
		setShowEditSegmentModal(false);
		setEditSegment(null);
	};

	const [editDaySegmentMutation] = daySegmentsApi.useEditDailyPatternSegmentMutation();
	const [deleteDaySegmentMutation] = daySegmentsApi.useDeleteDailyPatternSegmentMutation();

	// Function to handle deleting a segment
	// Adjusts the neighboring segment's start or end hour accordingly
	const handleDeleteSegment = (seg: DaySegment, direction: 'earlier' | 'later') => {
		const index = daySegments.findIndex(s => s.id === seg.id);
		const targetSegment = direction === 'earlier' ? daySegments[index - 1] : daySegments[index + 1];

		const startHour = direction === 'later' ? seg.startHour : targetSegment.startHour;
		const endHour = direction === 'earlier' ? seg.endHour : targetSegment.endHour;

		const editSegment: UpdateDaySegmentPayload = {
			...targetSegment,
			startHour,
			endHour,
			originalStartHour: startHour,
			originalEndHour: endHour
		};
		const editPromise = editDaySegmentMutation(editSegment).unwrap();
		const deletePromise = deleteDaySegmentMutation({ id: seg.id }).unwrap();

		Promise.all([editPromise, deletePromise])
			.catch(error => {
				showErrorNotification(error);
			});
	};

	// Delete day confirmation modal
	const [showDeleteModal, setShowDeleteModal] = React.useState(false);
	const [deleteDayMutation, { isLoading: isDeleting }] = daysApi.useDeleteDailyPatternMutation();

	// Function to handle deleting the day
	const handleDeleteDay = () => {
		setShowDeleteModal(false);
		deleteDayMutation({ id: dayDetails.id }).unwrap()
			.then(() => {
				showSuccessNotification(translate('daily.patterns.delete.success'));
				props.handleClose();
			})
			.catch(error => {
				showErrorNotification(translate('daily.patterns.delete.error'));
			});
	};

	/* ── Render ───────────────────────────────────────────── */
	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} size="xl">
				<ModalHeader toggle={props.handleClose}>
					<FormattedMessage id="daily.patterns.edit" />
				</ModalHeader>

				<ModalBody>
					<Container>
						{/* Name and Note */}
						<Row>
							<Col>
								<FormGroup>
									<Label for="name">{translate('name')}</Label>
									<Input id="name" name="name" required value={dayDetails.name} onChange={handleStringChange} />
									<FormFeedback>
										{nameValidationMessageId && <FormattedMessage id={nameValidationMessageId as string} />}
									</FormFeedback>
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for="note">{translate('note')}</Label>
									<Input id="note" name="note" value={dayDetails.note} onChange={handleStringChange} />
								</FormGroup>
							</Col>
						</Row>

						{/* Table */}
						{/* TODO: internationalize */}
						<h5 className="mt-3 mb-2"><FormattedMessage id="daily.patterns.segments.table.title" /></h5>
						<Table striped bordered>
							<thead>
								<tr>
									<th><FormattedMessage id="daily.patterns.segments.table.timeRange" /></th>
									<th><FormattedMessage id="daily.patterns.segments.table.slope" /></th>
									<th><FormattedMessage id="daily.patterns.segments.table.intercept" /></th>
									<th><FormattedMessage id="daily.patterns.segments.table.note" /></th>
									<th><FormattedMessage id="daily.patterns.segments.table.edit" /></th>
									<th><FormattedMessage id="split.earlier" /></th>
									<th><FormattedMessage id="split.later" /></th>
									<th>Del ↑</th>
									<th>Del ↓</th>
								</tr>
							</thead>
							<tbody>
								{paged?.map(seg => (
									<tr key={seg.id}>
										<td>{hourToTime(seg.startHour)} - {hourToTime(seg.endHour)}</td>
										<td>{seg.slope}</td>
										<td>{seg.intercept}</td>
										<td>
											{(seg.note ?? '').length > 100
												? (seg.note ?? '').slice(0, 100) + ' …'
												: seg.note ?? ''}
										</td>
										<td>
											<Button color="secondary" size="sm" onClick={() => handleShowEditSegmentModal(seg)}>
												<FormattedMessage id="edit" />
											</Button>
										</td>
										<td>
											{/* only show split buttons if segment is longer than 1 hour */}
											{seg.endHour - seg.startHour > 1 && <SplitDaySegmentComponent daySegment={seg} direction="earlier" />}
										</td>
										<td>
											{seg.endHour - seg.startHour > 1 && <SplitDaySegmentComponent daySegment={seg} direction="later" />}
										</td>
										<td>
											{/* first segment cannout delete earlier */}
											{seg.startHour > 0 &&
												<Button size="sm" color="danger" onClick={() => handleDeleteSegment(seg, 'earlier')}>
													Del ↑
												</Button>
											}
										</td>
										<td>
											{/* last segment cannot delete later */}
											{seg.endHour < 24 &&
												<Button size="sm" color="danger" onClick={() => handleDeleteSegment(seg, 'later')}>
													Del ↓
												</Button>
											}
										</td>
									</tr>
								))}
							</tbody>
						</Table>

						{/* Pagination */}
						{daySegments && daySegments.length > PER_PAGE && (
							<Pagination style={{ justifyContent: 'center' }}>
								<PaginationItem disabled={page === 1}>
									<PaginationLink first onClick={() => setPage(1)} />
								</PaginationItem>
								<PaginationItem disabled={page === 1}>
									<PaginationLink previous onClick={() => setPage(p => p - 1)} />
								</PaginationItem>
								{Array.from({ length: totalPages }, (_, i) => (
									<PaginationItem key={i} active={page === i + 1}>
										<PaginationLink onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem disabled={page === totalPages}>
									<PaginationLink next onClick={() => setPage(p => p + 1)} />
								</PaginationItem>
								<PaginationItem disabled={page === totalPages}>
									<PaginationLink last onClick={() => setPage(totalPages)} />
								</PaginationItem>
							</Pagination>
						)}
					</Container>
				</ModalBody>

				<ModalFooter>
					{/* Delete day */}
					<Button color="danger" onClick={() => setShowDeleteModal(true)} disabled={isSaving || isDeleting}>
						{translate('daily.patterns.delete.button')}
					</Button>
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					<Button color="primary" onClick={handleSubmit} disabled={!isDayValid || isSaving || isDeleting}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>

				{/* Delete confirmation modal */}
				<ConfirmActionModalComponent
					show={showDeleteModal}
					actionConfirmMessage={translate('daily.patterns.delete.confirm')}
					actionFunction={handleDeleteDay}
					handleClose={() => setShowDeleteModal(false)}
					actionConfirmText={translate('daily.patterns.delete.confirm.button')}
					actionRejectText={translate('cancel')}
				/>
			</Modal >

			{/* Edit Day Segment modal */}
			{editSegment && <EditDaySegmentModalComponent show={showEditSegmentModal} daySegment={editSegment} handleClose={handleCloseEditSegmentModal} />}
		</>
	);
}
