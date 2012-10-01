class EventService

  def self.find_next
    event = Event.where("start_at >= ?", Time.now).first
    EventDecorator.decorate(event)
  end

end