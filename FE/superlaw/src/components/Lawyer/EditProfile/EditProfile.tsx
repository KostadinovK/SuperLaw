import { FormEvent, useEffect, useState } from 'react';
import './EditProfile.scss';
import { Button, Form } from "react-bootstrap";
import FileUpload from '../../FileUpload';
import toastService from '../../../services/toastService';
import Select from 'react-select';
import { ActionMeta } from 'react-select';
import profileService from '../../../services/profileService';
import legalCategoriesService from '../../../services/legalCategoriesService';
import judicialRegionsService from '../../../services/judicialRegionsService';
import { useNavigate } from 'react-router-dom';
import ProfileInput from '../../../models/inputs/ProfileInput';
import Calendar from 'react-calendar';
import moment from 'moment';
import ScheduleDayInput from '../../../models/inputs/ScheduleDayInput';
import CalendarDateValue from '../../../models/CalendarDateValue';

const EditProfile = () => {
  const navigate = useNavigate();

  const todayDate = moment().toDate();
  const maxDate = moment().add(2, "M").toDate();

  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);

  const [profile, setProfile] = useState<ProfileInput>({
    image: '',
    description: "",
    hourlyRate: 0,
    address: "",
    categories: [],
    regions: [],
    schedule: [],
    isJunior: false,
    isCompleted: false,
  });

  const [errorMessage, setErrorMessage] = useState("");

  const [selectedDaySlots, setSelectedDaySlots] = useState<ScheduleDayInput>(
    {
      date: new Date(),
      timeSlots: [],
    }
  );
  
  const [scheduleErrorMessage, setScheduleErrorMessage] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
        const res = await legalCategoriesService.getCategories();

        let categoriesRes: any = [];

        res.forEach(x => {
          categoriesRes.push({
            value: x.id,
            label: x.name
          });
        });

        setCategories(categoriesRes);
    };

    const fetchRegions = async () => {
      const res = await judicialRegionsService.getRegions();

      let regionsRes: any = [];

      res.forEach(x => {
        regionsRes.push({
          value: x.id,
          label: x.name
        });
      });

      setRegions(regionsRes);
    };

    const fetchProfile = async () => {
      const res = await profileService.getOwnProfileDataForEdit();
      console.log(res);
      setProfile({
        ...profile,
        description: res.description,
        hourlyRate: res.hourlyRate,
        address: res.address,
        categories: res.categories,
        regions: res.regions,
        schedule: res.schedule,
        isCompleted: res.isCompleted,
        isJunior: res.isJunior
      });
    };
  
    fetchCategories();
    fetchRegions();
    fetchProfile();
  }, []);

  const onProfilePicUploadSuccess = (file: File) => {
    setProfile({...profile, image: file});
  };

  const onProfilePicUploadError = (error: string) => {
    toastService.showError(error);
  };

  const onInput = (e: any) => {
    const inputName = e.target.name;
    let value = e.target.value;

    if(inputName === 'hourlyRate'){
      value = Number(value);
    }

    setProfile({
      ...profile,
      [inputName]: value,
    });
  };

  const onCategorySelect = (newValue: any, actionMeta: ActionMeta<never>): void  => {
    setProfile({...profile, categories: newValue});
  };

  const onRegionSelect = (newValue: any, actionMeta: ActionMeta<never>): void  => {
    setProfile({...profile, regions: newValue});
  }; 

  const onTimeSlotDelete = (index: number) => {
    let schedule = selectedDaySlots.timeSlots;

    schedule.splice(index, 1);

    setSelectedDaySlots({
      date: selectedDaySlots.date,
      timeSlots: selectedDaySlots.timeSlots,
    });
  };

  const onTimeSlotAdd = (event: any) => {
    const from =
      event.target.parentElement.getElementsByClassName("from")[0].value;
    const to = event.target.parentElement.getElementsByClassName("to")[0].value;

    if (from === "" || to === "") {
      return;
    }

    const err = profileService.validateTimeSlot(from, to);

    if (err) {
      setScheduleErrorMessage(err);
      return;
    }

    const errMsg = profileService.validateTimeSlotsInDay(
      from,
      to,
      selectedDaySlots.timeSlots
    );

    if (errMsg) {
      setScheduleErrorMessage(errMsg);
      return;
    }

    setSelectedDaySlots({
      date: selectedDaySlots.date,
      timeSlots: [
        ...selectedDaySlots.timeSlots,
        {
          id: 0,
          from: from,
          to: to,
          hasMeeting: false,
          clientName: null
        },
      ],
    });

    setScheduleErrorMessage("");
  };

  const onDateSelect = (dateValue: CalendarDateValue) => {
    //Set in the profile the defined slots for the previous selected day
    if (selectedDaySlots.timeSlots.length !== 0) {
      let profileScheduleWithoutSelected = [...profile.schedule].filter(
        (x) =>
          new Date(x.date).setHours(0, 0, 0, 0) !==
          new Date(selectedDaySlots.date).setHours(0, 0, 0, 0)
      );

      setProfile({
        image: profile.image,
        description: profile.description,
        hourlyRate: profile.hourlyRate,
        address: profile.address,
        categories: profile.categories,
        regions: profile.regions,
        schedule: [...profileScheduleWithoutSelected, selectedDaySlots],
        isJunior: profile.isJunior,
        isCompleted: profile.isCompleted,
      });
    }

    setScheduleErrorMessage("");

    const date = dateValue as Date;

    let scheduleDay = profile.schedule.filter(
      (x) => new Date(x.date).setHours(0,0,0,0) === date.setHours(0,0,0,0)
    )[0];

    const defaultDay = {
      date: date,
      timeSlots: [],
    };

    if (!scheduleDay) {
      scheduleDay = defaultDay;
    }

    setSelectedDaySlots(scheduleDay);
  };

  const onCheckbox = (e: any) => {
    const inputName = e.target.name;
    const value = e.target.checked;
    setProfile({
      ...profile,
      [inputName]: value,
    });
  }

  const isDataValid = () => {
    if (profile.description === ''){
      setErrorMessage("Моля въведете описание");
      return false;
    }

    if (Number.isNaN(profile.hourlyRate) || profile.hourlyRate < 100 || profile.hourlyRate > 500){
      setErrorMessage("Часовата ставка трябва да е число между 100 и 500");
      return false;
    }

    if (profile.address === ''){
      setErrorMessage("Моля въведете адрес");
      return false;
    }

    if (profile.categories.length === 0){
      setErrorMessage("Моля изберете поне една категория");
      return false;
    }

    if (profile.regions.length === 0){
      setErrorMessage("Моля изберете поне един район");
      return false;
    }

    setErrorMessage('');
    return true;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
   
    if (!isDataValid()){
      return;
    }

    let profileSchedule = [...profile.schedule];

    if (selectedDaySlots.date !== null) {
      let profileScheduleWithoutSelected = [...profile.schedule].filter(
        (x) =>
          new Date(x.date).setHours(0, 0, 0, 0) !==
          new Date(selectedDaySlots.date).setHours(0, 0, 0, 0)
      );

      profileSchedule = [
        ...profileScheduleWithoutSelected,
        selectedDaySlots
      ];

    }

    let categories = profile.categories.map((c: any) => c.value);
    let regions = profile.regions.map((r: any) => r.value);

    const formData = new FormData();
    formData.append('image', profile.image);
    formData.append('description', profile.description);
    formData.append('hourlyRate', profile.hourlyRate.toString());
    formData.append('address', profile.address);
    formData.append('categories', categories.join());
    formData.append('regions', regions.join());
    formData.append("schedule", JSON.stringify(profileSchedule));
    formData.append('isJunior', profile.isJunior.toString());
    formData.append('isCompleted', profile.isCompleted.toString());
    
    const res = await profileService.editProfile(formData);

    if (!res.isError){
      toastService.showSuccess("Успешно редактирахте вашия профил");
      navigate('/profile');
    }

  };

  return (
    <div className="form-wrapper-edit-profile">
        <form className="edit-profile-form" onSubmit={onSubmit}>
          <h1 className="register-heading">Редактиране на профил</h1>
          <div className="form-group picture">
            <label>Снимка (ако не качите снимка, предишната Ви ще остане)</label>
              <FileUpload onFileSelectSuccess={onProfilePicUploadSuccess} onFileSelectError={onProfilePicUploadError}/>
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea id="description" className="form-control" name="description" placeholder='Основна информация за Вас като адвокат' value={profile.description} rows={4} onChange={(e) => onInput(e)}/>
          </div>

          <div className="form-group">
            <label htmlFor="hourly-rate">Часова ставка</label>
            <input id="hourly-rate" type="text" className="form-control" name="hourlyRate" value={profile.hourlyRate} onChange={(e) => onInput(e)}/>
          </div>

          <div className="form-group">
            <label htmlFor="address">Работен адрес</label>
            <input id="address" type="text" className="form-control" name="address" value={profile.address} onChange={(e) => onInput(e)}/>
          </div>

          <div className="form-group selection">
            <label htmlFor="legalCategory">Категории</label>
            <Select
              isMulti
              name="legalCategories"
              options={categories}
              className="basic-multi-select"
              classNamePrefix="select"
              value={profile.categories}
              onChange={onCategorySelect} 
            />
          </div>

          <div className="form-group selection">
            <label htmlFor="legalCategory">Съдебни райони</label>
            <Select
              isMulti
              name="regions"
              options={regions}
              className="basic-multi-select"
              classNamePrefix="select"
              value={profile.regions}
              onChange={onRegionSelect} 
            />
          </div>

          <div className='form-group schedule'>
            <label htmlFor="schedule">График</label>
            <Calendar
            onChange={onDateSelect}
            defaultView="month"
            minDetail="month"
            maxDetail="month"
            next2Label={null}
            prev2Label={null}
            minDate={todayDate}
            maxDate={maxDate}
          />
          {selectedDaySlots && (
            <div className="time-slots">
              {selectedDaySlots.timeSlots.map((timeSlot, ind) => (
                <div className={`time-slot ${timeSlot.hasMeeting ? 'occupied' : ''}`} key={ind}>
                  <p>
                    {timeSlot.from} - {timeSlot.to}
                    { !timeSlot.hasMeeting && <span
                      className="delete"
                      onClick={() => onTimeSlotDelete(ind)}
                    >
                      X
                    </span>}
                  </p>
                  {timeSlot.hasMeeting && timeSlot.clientName && 
                        <p>
                          {timeSlot.clientName}
                        </p>
                  }
                </div>
              ))}

              <div className="select-range">
                <span>От: </span>
                <input type="time" className="from" />
                <span>До: </span>
                <input type="time" className="to" />
                <span className="add" onClick={onTimeSlotAdd}>
                  ✓
                </span>
              </div>
              {scheduleErrorMessage !== "" && (
                <p className="error">{scheduleErrorMessage}</p>
              )}
            </div>
          )}
          </div>

          <div className="form-group checkboxes">
            <Form.Check
              className='checkbox'
              type="switch"
              id="isJunior"
              label="Младши адвокат ли сте?"
              name='isJunior'
              checked={profile.isJunior}
              onChange={onCheckbox}
            />
            <p className='info-isCompleted'>Със завършването на профила Ви той ще бъде видим за потребителите</p>
            <Form.Check
              className='checkbox'
              type="switch"
              label="Профилът Ви завършен ли е?"
              id="isCompleted"
              name='isCompleted'
              checked={profile.isCompleted}
              onChange={onCheckbox}
            />
          </div>

          <p className='error'>
              {errorMessage}
          </p>

          <Button className="primary-btn" type="submit" variant="primary">
            Редактирай
          </Button>
        </form>
      </div>
  );
};

export default EditProfile;