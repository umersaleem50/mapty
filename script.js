'use strict';

// // prettier-ignore
// const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  click = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  clicked() {
    this.click++;
  }

  _getDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `${
      this.type === 'running' ? '🏃‍♂️' : '🚴'
    } ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, candence) {
    super(coords, distance, duration);
    this.candence = candence;
    this.calcPace();
    this.type = 'running';
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.speed();
    this.type = 'cycling';
  }

  speed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  #btnDelete = document.querySelector('.btn--delete');

  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    this._getLocalStorage();
    // this._setLocalStorage();
    document.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPointer.bind(this));
    this.#btnDelete.addEventListener('click', this._deleteWorkouts);
  }

  _showdeletebutton() {
    this.#btnDelete.classList.remove('btn--hidden');
  }

  _deleteWorkouts() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        //if yes then js will call funtion with obtained postion as argument
        function () {
          alert('Failed to get location');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coord = [latitude, longitude];
    this.#map = L.map('map').setView(coord, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this._setMarkers();
  }

  _showForm(mapE) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapEvent = mapE;
  }

  _toggleElevationField(e) {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _setLocalStorage() {
    console.log(this.#workouts);
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _setMarkers() {
    this.#workouts.forEach(work => this._renderWorkout(work));
    // console.log(this.#workouts);
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (data) {
      data.forEach(work => {
        const newWorkout =
          work.type === 'running'
            ? new Running(
                work.coords,
                work.distance,
                work.duration,
                work.candence
              )
            : new Cycling(
                work.coords,
                work.distance,
                work.duration,
                work.elevationGain
              );
        this.#workouts.push(newWorkout);
        this._randerList(newWorkout);
      });
      this._showdeletebutton();
    }
  }

  _newWorkout(e) {
    e.preventDefault();
    // console.log(this.#mapEvent)
    //HELPER METHOD/ FUNTIONS

    const checkIsNumber = (...inputs) =>
      inputs.every(num => Number.isFinite(num));
    const checkIsNegitive = (...inputs) => inputs.some(num => num < 0);

    //GET ALL FORM VALUES
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //CHECK FOR VALID NUMBERS
    if (type === 'running') {
      if (
        !checkIsNumber(distance, duration, cadence) ||
        checkIsNegitive(distance, duration, cadence)
      ) {
        return alert('Please enter all valid positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //IF ACTIVITY = RUNNING, CREATE RUNNING WORKOUT
    if (type === 'cycling') {
      if (
        !checkIsNumber(distance, duration, cadence) ||
        checkIsNegitive(distance, duration)
      ) {
        return alert('Please enter all valid positive numbers!');
      }
      console.log(elevation);
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this._renderWorkout(workout);
    this._randerList(workout);
    console.log(workout);
    this.#workouts.push(workout);
    //IF ACTIVITY = CYCLING, CREATE CYCLING WORKOUT

    //RENDER WORKOUT

    //ADD WORKOUTS TO LOCAL STORAGE
    this._setLocalStorage();
  }

  _renderWorkout = workout => {
    const coords = workout.coords;
    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout._getDescription())
      .openPopup();
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // console.log(workout._getDescription());
  };

  _randerList = workout => {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout._getDescription()}</h2>
            <div class="workout__details">
                <span class="workout__icon">${
                  workout.type === 'running' ? '🏃‍♂️' : '🚴'
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>

            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            
        `;

    //WHERE I LEFT

    if (workout.type === 'running') {
      html =
        html +
        `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.candence}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">spm</span>
            </div>

        </li>
      `;
    }

    if (workout.type === 'cycling') {
      html =
        html +
        `
            <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                      1
                    )}</span>
                    <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
            </div>
        </li>
        `;
    }

    form.insertAdjacentHTML('afterend', html);
    this._showdeletebutton();
    // console.log(workout);
  };

  _moveToPointer(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animation: true,
      pan: {
        duration: 1,
      },
    });
    // console.log(workout);
    workout.clicked();
  }
}

const app = new App();
