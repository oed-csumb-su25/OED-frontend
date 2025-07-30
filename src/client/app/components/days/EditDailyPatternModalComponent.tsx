// EditDailyPatternModalComponent.tsx

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
import { Day, DaySegment } from 'types/redux/days';
import { daysApi } from '../../redux/api/daysApi';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { LocaleDataKey } from '../../translations/data';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import EditDaySegmentModalComponent from './EditDaySegmentModalComponent';

//
export interface Props {
	show: boolean;
	day: Day;
	handleClose: () => void;
}

// Segment interface extends DaySegment to include id and date range
// interface Segment extends DaySegment {
// 	id: number;
// 	start: string;      // ISO | '-inf'
// 	end: string;      // ISO | '+inf'
// 	pattern: string;
// }

const PER_PAGE = 10;

/* spec‑accurate range text */
// const tsFmt = (iso: string) =>
// 	moment.parseZone(iso).format('MMMM D, YYYY hh:mm:ss A');

// const dateRange = (s: DaySegment) =>
// 	s.start === '-inf'
// 		? `to ${tsFmt(s.end)}`
// 		: s.end === '+inf'
// 			? `from ${tsFmt(s.start)}`
// 			: `${tsFmt(s.start)} to ${tsFmt(s.end)}`;

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

// Main component for editing daily patterns
// Displays a modal with a table of segments and options to edit, split, or delete them
export default function EditDailyPatternModalComponent({ show, day, handleClose }: Props) {

	// const [segments, setSegments] = React.useState<Segment[]>(
	// 	(day.segments as unknown as Segment[]) ?? []
	// );

	const [dayDetails, setDayDetails] = React.useState({ ...day });

	const { data: daySegments, isFetching: isFetchingDaySegments } = daySegmentsApi.useGetDailyPatternSegmentsByDayIdQuery(day.id);

	const [editDayMutation, { isLoading: isSaving }] = daysApi.useEditDailyPatternMutation();

	const [addDaySegmentMutation, { isLoading: isAddingDaySegment }] = daySegmentsApi.useAddDailyPatternSegmentMutation();

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDayDetails({ ...dayDetails, [e.target.name]: e.target.value });
	};

	const handleSubmit = () => {
		editDayMutation(dayDetails).unwrap()
			.then(() => {
				// TODO: internationalize
				showSuccessNotification('Successfully edited day.');
				handleClose();
			}).catch(error => {
				// TODO: internationalize
				showErrorNotification(error);
			});
	};

	/* --- TEMP DEMO ROWS -------------------------------------------------- */
	// React.useEffect(() => {
	// 	if (segments.length === 0) {
	// 		setSegments([
	// 			/* 1 ─ full dates, No Pattern */
	// 			{
	// 				id: 1,
	// 				start: '2024-03-09T00:00:00Z',
	// 				end: '2025-01-02T00:00:00Z',
	// 				slope: 123.45,
	// 				intercept: 0,
	// 				pattern: 'No Pattern',
	// 				note: 'Sample with full dates and no pattern',
	// 				dayId: 0,
	// 				hour: 0
	// 			},
	// 			/* 2 ─ full dates, Weekly ABC */
	// 			{
	// 				id: 2,
	// 				start: '2024-03-09T00:00:00Z',
	// 				end: '2025-01-02T00:00:00Z',
	// 				slope: 0,
	// 				intercept: 0,
	// 				pattern: 'Weekly ABC',
	// 				note: 'Sample with full dates and pattern',
	// 				dayId: 0,
	// 				hour: 0
	// 			},
	// 			/* 3 ─ from -∞ to a date */
	// 			{
	// 				id: 3,
	// 				start: '-inf',
	// 				end: '2025-01-02T00:00:00Z',
	// 				slope: 123.45,
	// 				intercept: 0,
	// 				pattern: 'No Pattern',
	// 				note: 'Sample where it applies from -inf and no pattern',
	// 				dayId: 0,
	// 				hour: 0
	// 			},
	// 			/* 4 ─ from a date to +∞, Weekly XYZ */
	// 			{
	// 				id: 4,
	// 				start: '2025-01-02T00:00:00Z',
	// 				end: '+inf',
	// 				slope: 0,
	// 				intercept: 0,
	// 				pattern: 'Weekly XYZ',
	// 				note: 'Sample where it applies to +inf and pattern',
	// 				dayId: 0,
	// 				hour: 0
	// 			}
	// 		]);
	// 	}

	// }, []);


	// Pagination
	const [page, setPage] = React.useState(1);
	const totalPages = Math.ceil(daySegments?.length ?? 1 / PER_PAGE);
	const paged = daySegments?.slice((page - 1) * PER_PAGE, page * PER_PAGE);

	// Editing state
	// const [editing, setEditing] = React.useState<Segment | null>(null);
	const [split, setSplit] = React.useState<{
		seg: DaySegment | null;
		dir: 'earlier' | 'later' | null;
		dt: string;
		err: string;
	}>({ seg: null, dir: null, dt: '', err: '' });

	// State to hold validation message for day name
	// This is used to show an error message if the day name is invalid
	const [nameValidationMessageId, setNameValidationMessageId] = React.useState<LocaleDataKey | null>(null);

	const isDayValid = React.useMemo(() => {
		if (dayDetails.name === '') {
			setNameValidationMessageId('error.required');
			return false;
		}
		setNameValidationMessageId(null);
		return true;
	}, [dayDetails]);

	const [deleteDayMutation, { isLoading: isDeleting }] = daysApi.useDeleteDailyPatternMutation();

	// Update a segment field
	// const upd = (id: number, field: keyof DaySegment, val: any) =>
	// 	setSegments(prev => prev.map(s => (s.id === id ? { ...s, [field]: val } : s)));

	// const deletePart = (seg: DaySegment, dir: 'earlier' | 'later') => {
	// 	const mid = moment(seg.start).add(
	// 		moment(seg.end).diff(moment(seg.start)) / 2
	// 	).toISOString();
	// 	if (dir === 'earlier') upd(seg.id, 'start', mid);
	// 	else upd(seg.id, 'end', mid);
	// };

	// const splitNow = () => {
	// 	if (!split.seg) return;
	// 	const dt = moment(split.dt, 'YYYY-MM-DD HH:mm:ss', true);
	// 	if (
	// 		!dt.isValid() ||
	// 		!dt.isBetween(moment(split.seg.start), moment(split.seg.end))
	// 	) {
	// 		setSplit(m => ({ ...m, err: 'Must be inside current range' }));
	// 		return;
	// 	}
	// 	const first = { ...split.seg, end: dt.toISOString() };
	// 	const second = { ...split.seg, start: dt.toISOString() };
	// 	setSegments(prev =>
	// 		prev
	// 			.filter(s => s.id !== split.seg!.id)
	// 			.concat(split.dir === 'earlier' ? [first, second] : [second, first])
	// 			.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
	// 	);
	// 	setSplit({ seg: null, dir: null, dt: '', err: '' });
	// };

	/* ── Render ───────────────────────────────────────────── */
	return (
		<>
			<Modal isOpen={show} toggle={handleClose} size="xl">
				{/* TODO: internationalize */}
				<ModalHeader>
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
						<h5 className="mt-3 mb-2">Segments Table</h5>
						<Table striped bordered>
							<thead>
								<tr>
									<th>Date Range</th>
									<th>Slope</th>
									<th>Intercept</th>
									<th>Note</th>
									<th>Edit</th>
									<th>Split ↑</th>
									<th>Split ↓</th>
									<th>Del ↑</th>
									<th>Del ↓</th>
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
											<EditDaySegmentModalComponent daySegment={seg} />
										</td>
										<td>
											<Button size="sm" onClick={() => setSplit({ seg, dir: 'earlier', dt: '', err: '' })}>Split ↑</Button>
										</td>
										<td>
											<Button size="sm" onClick={() => setSplit({ seg, dir: 'later', dt: '', err: '' })}>Split ↓</Button>
										</td>
										<td>
											<Button size="sm" color="danger"
											// onClick={() => deletePart(seg, 'earlier')}
											>Del ↑</Button>
										</td>
										<td>
											<Button size="sm" color="danger"
											// onClick={() => deletePart(seg, 'later')}
											>
												Del ↓
											</Button>
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
					<Button color="secondary" onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					<Button color="primary" onClick={handleSubmit} disabled={!isDayValid || isSaving || isDeleting}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal >



			{/* Split modal */}
			{
				split.seg && (
					<Modal isOpen toggle={() => setSplit({ seg: null, dir: null, dt: '', err: '' })}>
						<ModalHeader>
							Split {split.dir === 'earlier' ? 'Earlier ↑' : 'Later ↓'}
						</ModalHeader>
						<ModalBody>
							<p>
								Enter datetime (YYYY‑MM‑DD HH:mm:ss) between<br />
								{/* {dateRange(split.seg)} */}
							</p>
							<Input
								value={split.dt}
								placeholder="YYYY‑MM‑DD HH:mm:ss"
								onChange={e => setSplit(m => ({ ...m, dt: e.target.value, err: '' }))}
								invalid={Boolean(split.err)}
							/>
							{split.err && <FormFeedback className="d-block">{split.err}</FormFeedback>}
						</ModalBody>
						<ModalFooter>
							<Button color="secondary" onClick={() => setSplit({ seg: null, dir: null, dt: '', err: '' })}>
								Cancel
							</Button>
							<Button color="primary"
							// onClick={splitNow}
							>Save</Button>
						</ModalFooter>
					</Modal>
				)
			}
		</>
	);
}
